<?php
// public/admin-rename.php
// Acceso: https://www.judaicabreslovcolombia.com/admin-rename.php

// 🔒 SEGURIDAD BÁSICA
$password = 'rename2025'; // Cambiar por algo más seguro
if (!isset($_GET['pwd']) || $_GET['pwd'] !== $password) {
    die('❌ Acceso denegado. URL correcta: ?pwd=rename2025');
}

// 📋 CONFIGURACIÓN
$host = 'localhost';
$user = 'usr_tienda_judaica_breslov';
$pass = 'Z71@ya66a';
$db = 'Tienda_Judaica_Breslov';

// ⚙️ CONFIGURACIÓN DE PROCESAMIENTO
$batch_size = 1; // Procesar 1 producto por vez
$simulate = !isset($_GET['execute']); // Por defecto simula

?>
<!DOCTYPE html>
<html>
<head>
    <title>🎯 Renombramiento de Imágenes SEO</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; background: white; padding: 20px; border-radius: 8px; }
        .product { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .success { color: #28a745; } .error { color: #dc3545; } .warning { color: #ffc107; }
        .image-row { display: flex; justify-content: space-between; margin: 5px 0; padding: 8px; background: #f8f9fa; }
        .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
        .btn-primary { background: #007bff; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: black; }
    </style>
</head>
<body>

<div class="container">
    <h1>🎯 Renombramiento de Imágenes SEO</h1>
    
    <?php if ($simulate): ?>
        <div class="warning">⚠️ <strong>MODO SIMULACIÓN</strong> - No se modificará nada</div>
        <p><a href="?pwd=<?=$password?>&execute=1" class="btn btn-success">🚀 EJECUTAR REAL</a></p>
    <?php else: ?>
        <div class="success">✅ <strong>MODO EJECUCIÓN REAL</strong> - Se modificarán archivos</div>
        <p><a href="?pwd=<?=$password?>" class="btn btn-warning">👁️ Volver a simulación</a></p>
    <?php endif; ?>
    
    <?php
    try {
        // Conectar a DB
        $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        echo "<p class='success'>✅ Conectado a base de datos</p>";
        
        // Obtener producto a procesar
        $last_processed = isset($_GET['last']) ? (int)$_GET['last'] : 0;
        
        $stmt = $pdo->prepare("
            SELECT p.id, p.name, p.slug
            FROM products p 
            INNER JOIN product_images pi ON p.id = pi.product_id
            WHERE p.status = 'active' AND p.id > ?
            GROUP BY p.id 
            ORDER BY p.id 
            LIMIT 1
        ");
        $stmt->execute([$last_processed]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            echo "<h2 class='success'>🎉 ¡TODOS LOS PRODUCTOS COMPLETADOS!</h2>";
            echo "<p>No hay más productos para procesar.</p>";
        } else {
            echo "<h2>📦 Procesando producto #{$product['id']}</h2>";
            echo "<h3>{$product['name']}</h3>";
            echo "<p><strong>Slug:</strong> {$product['slug']}</p>";
            
            // Obtener imágenes del producto
            $imgStmt = $pdo->prepare("
                SELECT id, image_url, alt_text, is_featured, sort_order
                FROM product_images 
                WHERE product_id = ? 
                ORDER BY is_featured DESC, sort_order ASC
            ");
            $imgStmt->execute([$product['id']]);
            $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "<h4>📸 Imágenes encontradas: " . count($images) . "</h4>";
            
            $renamed_count = 0;
            
            foreach ($images as $index => $image) {
                $current_path = $image['image_url'];
                $current_name = basename($current_path);
                $extension = pathinfo($current_name, PATHINFO_EXTENSION) ?: 'webp';
                
                // Generar nuevo nombre
                if ($index === 0) {
                    $new_name = $product['slug'] . '.' . $extension;
                } else {
                    $new_name = $product['slug'] . '-vista-' . ($index + 1) . '.' . $extension;
                }
                
                $new_url = '/optimized/2025/07/' . $new_name;
                
                echo "<div class='image-row'>";
                echo "<div>";
                echo "<strong>❌ Actual:</strong> $current_name<br>";
                echo "<strong>✅ Nuevo:</strong> $new_name";
                echo "</div>";
                
                if (!$simulate) {
                    // EJECUTAR REAL - RUTAS CORREGIDAS
                    $current_full_path = $_SERVER['DOCUMENT_ROOT'] . '/public' . $current_path;
                    $new_full_path = $_SERVER['DOCUMENT_ROOT'] . '/public' . $new_url;
                    
                    if (file_exists($current_full_path)) {
                        // Verificar si el nuevo nombre ya existe
                        if (file_exists($new_full_path)) {
                            $timestamp = time();
                            $unique_name = str_replace('.' . $extension, "-$timestamp." . $extension, $new_name);
                            $unique_url = '/optimized/2025/07/' . $unique_name;
                            $unique_full_path = $_SERVER['DOCUMENT_ROOT'] . $unique_url;
                            
                            if (rename($current_full_path, $unique_full_path)) {
                                $updateStmt = $pdo->prepare("UPDATE product_images SET image_url = ? WHERE id = ?");
                                $updateStmt->execute([$unique_url, $image['id']]);
                                echo "<div class='success'>✅ Renombrado a: $unique_name</div>";
                                $renamed_count++;
                            } else {
                                echo "<div class='error'>❌ Error renombrando archivo</div>";
                            }
                        } else {
                            if (rename($current_full_path, $new_full_path)) {
                                $updateStmt = $pdo->prepare("UPDATE product_images SET image_url = ? WHERE id = ?");
                                $updateStmt->execute([$new_url, $image['id']]);
                                echo "<div class='success'>✅ Renombrado exitosamente</div>";
                                $renamed_count++;
                            } else {
                                echo "<div class='error'>❌ Error renombrando archivo</div>";
                            }
                        }
                    } else {
                        echo "<div class='error'>❌ Archivo no encontrado: $current_full_path</div>";
                    }
                } else {
                    echo "<div class='warning'>👁️ Simulación - no se modifica</div>";
                }
                
                echo "</div>";
            }
            
            if (!$simulate && $renamed_count > 0) {
                echo "<p class='success'><strong>✅ Producto completado: $renamed_count imágenes renombradas</strong></p>";
            }
            
            // Mostrar siguiente
            $nextStmt = $pdo->prepare("
                SELECT COUNT(DISTINCT p.id) as remaining
                FROM products p 
                INNER JOIN product_images pi ON p.id = pi.product_id
                WHERE p.status = 'active' AND p.id > ?
            ");
            $nextStmt->execute([$product['id']]);
            $next = $nextStmt->fetch(PDO::FETCH_ASSOC);
            
            echo "<h3>📊 Productos restantes: {$next['remaining']}</h3>";
            
            if ($next['remaining'] > 0) {
                $next_url = "?pwd=$password&last={$product['id']}";
                if (!$simulate) $next_url .= "&execute=1";
                
                echo "<p><a href='$next_url' class='btn btn-primary'>➡️ Siguiente Producto</a></p>";
                
                // Auto-refresh para proceso continuo (opcional)
                if (isset($_GET['auto'])) {
                    echo "<script>setTimeout(() => window.location.href = '$next_url&auto=1', 3000);</script>";
                    echo "<p>⏰ Redirigiendo automáticamente en 3 segundos... <a href='$next_url'>Continuar ahora</a></p>";
                } else {
                    echo "<p><a href='$next_url&auto=1' class='btn btn-warning'>🚀 Proceso Automático</a></p>";
                }
            } else {
                echo "<h2 class='success'>🎉 ¡PROCESO COMPLETADO!</h2>";
            }
        }
        
    } catch (PDOException $e) {
        echo "<div class='error'><h2>❌ Error de base de datos</h2>";
        echo "<p>Error: " . $e->getMessage() . "</p>";
        echo "<p><strong>Verifica:</strong></p>";
        echo "<ul>";
        echo "<li>Password de DB en línea 13</li>";
        echo "<li>Credenciales de conexión</li>";
        echo "<li>Que la DB esté accesible</li>";
        echo "</ul>";
        echo "</div>";
    }
    ?>
    
</div>

</body>
</html>