// lib/chatbot/ultra-judaica-synonyms-manager.js - SINÓNIMOS ULTRA-ESPECIALIZADOS V2.0

export class UltraJudaicaSynonymsManager {
  constructor() {
    this.synonymCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000;
    
    // SISTEMA ULTRA-COMPLETO DE SINÓNIMOS JUDAICOS
    this.judiacaKnowledge = {
      
      // ===== LIBROS SAGRADOS Y RELIGIOSOS =====
      torah_tanaj: {
        'torah': {
          primary: 'torah',
          variations: ['torá', 'tora', 'pentateuco', 'cinco libros', 'cinco libros de moisés', 'ley de moisés'],
          related: ['chumash', 'jumash', 'humash', 'sefer torah', 'rollo torah'],
          commentaries: ['torah con rashi', 'torah explicada', 'torah comentada', 'pentateuco comentado'],
          languages: ['torah hebreo', 'torah español', 'torah bilingüe', 'torah interlineal'],
          context: ['sagrada', 'divina', 'ley', 'mandamientos', 'mitzvot'],
          books: ['bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim', 'génesis', 'éxodo', 'levítico', 'números', 'deuteronomio']
        },

        'chumash': {
          primary: 'chumash',
          variations: ['jumash', 'humash', 'pentateuco comentado', 'torah comentada'],
          related: ['torah', 'rashi', 'comentarios', 'explicaciones'],
          commentaries: ['chumash rashi', 'chumash con comentarios', 'jumash bilingüe'],
          publishers: ['artscroll', 'kehot', 'bnei sholem', 'machon yerushalayim'],
          context: ['estudio', 'comentarios', 'explicación', 'interpretación']
        },

        'tanaj': {
          primary: 'tanaj',
          variations: ['tanakh', 'biblia hebrea', 'escrituras hebreas', 'biblia original', 'antiguo testamento hebreo'],
          sections: ['torah', 'neviim', 'ketuvim', 'ley', 'profetas', 'escritos', 'hagiógrafos'],
          books: ['samuel', 'reyes', 'isaías', 'jeremías', 'ezequiel', 'daniel', 'salmos', 'proverbios', 'job'],
          related: ['biblia completa', 'escrituras sagradas', 'texto sagrado'],
          languages: ['hebreo', 'español', 'bilingüe', 'traducido'],
          context: ['completo', 'original', 'auténtico', 'sagrado']
        },

        'tehilim': {
          primary: 'tehilim',
          variations: ['salmos', 'psalms', 'libro de salmos', 'salmos de david'],
          related: ['rey david', 'david hamelej', 'plegarias', 'oraciones', 'súplicas'],
          types: ['tehilim completo', 'salmos selectos', 'tehilim interlineal', 'salmos bilingüe'],
          uses: ['oración', 'meditación', 'consuelo', 'alabanza', 'petición', 'agradecimiento'],
          formats: ['grande', 'pequeño', 'bolsillo', 'familiar', 'personal'],
          context: ['espiritual', 'devocional', 'reconfortante', 'inspirador']
        }
      },

      breslov_literature: {
        'breslov': {
          primary: 'breslov',
          variations: ['breslev', 'breslau', 'jasidismo breslov', 'jasídico breslov'],
          founders: ['rabi najman', 'rabino najman', 'najman de breslov', 'nachman de breslov'],
          teachers: ['shalom arush', 'rabino arush', 'rab arush', 'r. arush'],
          concepts: ['emunah', 'fe simple', 'alegría', 'simplicidad', 'esperanza'],
          practices: ['hitbodedut', 'meditación', 'introspección', 'conexión'],
          context: ['movimiento', 'enseñanzas', 'sabiduría', 'crecimiento personal']
        },

        'emunah': {
          primary: 'emunah',
          variations: ['emuna', 'vivamos con emunah', 'fe simple', 'confianza'],
          books: ['jardín de la fe', 'vivamos con emunah', 'en el jardín de la fe', 'agua del edén'],
          authors: ['shalom arush', 'breslev israel'],
          topics: ['fe', 'confianza', 'providencia divina', 'bitajón'],
          applications: ['vida diaria', 'familia', 'trabajo', 'relaciones', 'desafíos'],
          context: ['fundamental', 'esencial', 'transformador', 'práctico']
        },

        'jardin_fe': {
          primary: 'jardín de la fe',
          variations: ['el jardín de la fe', 'garden of faith', 'gan emunah'],
          related: ['emunah', 'fe', 'confianza', 'providencia'],
          topics: ['fe simple', 'confianza', 'alegría', 'esperanza', 'crecimiento espiritual'],
          context: ['fundamental', 'clásico', 'bestseller', 'transformador']
        },

        'libros_arush': {
          primary: 'libros de shalom arush',
          variations: ['obras de arush', 'enseñanzas de arush', 'rabino arush libros'],
          titles: [
            'jardín de la fe', 'en el jardín de la paz', 'mujeres en el jardín',
            'agua del edén', 'luz del alma', 'educar con emunah', 'la novia feliz',
            'sendero de la fe', 'hombre feliz', 'mujer feliz'
          ],
          topics: ['emunah', 'familia', 'educación', 'matrimonio', 'crecimiento personal'],
          context: ['contemporáneo', 'práctico', 'aplicable', 'inspirador']
        }
      },

      talmudic_literature: {
        'talmud': {
          primary: 'talmud',
          variations: ['gemara', 'shas', 'talmud bavli', 'talmud babilónico'],
          types: ['talmud completo', 'talmud bavli', 'talmud yerushalmi', 'talmud jerusalén'],
          tractates: ['berajot', 'shabat', 'eruvin', 'pesajim', 'sukah', 'beitzah'],
          related: ['mishná', 'guemará', 'halajá', 'agadá'],
          publishers: ['artscroll', 'soncino', 'kehot', 'oz vehadar'],
          context: ['estudio avanzado', 'yeshiva', 'erudición', 'profundo']
        },

        'mishna': {
          primary: 'mishná',
          variations: ['mishnah', 'mishna berura', 'código oral'],
          orders: ['zeraim', 'moed', 'nashim', 'nezikin', 'kodashim', 'tohorot'],
          related: ['ley oral', 'halajá', 'código judío', 'legislación'],
          commentaries: ['mishna berura', 'comentarios mishna'],
          context: ['fundamental', 'base', 'ley judía', 'práctica']
        },

        'halaja': {
          primary: 'halajá',
          variations: ['halakha', 'ley judía', 'código judío', 'legislación judía'],
          codes: ['shuljan aruj', 'kitzur shuljan aruj', 'mishna berura', 'aruj hashuljan'],
          topics: ['kashrut', 'shabat', 'festividades', 'oración', 'familia'],
          context: ['práctica', 'vida diaria', 'observancia', 'tradición']
        }
      },

      prayer_books: {
        'sidur': {
          primary: 'sidur',
          variations: ['sidurim', 'libro de rezos', 'libro de oraciones', 'libro plegarias', 'prayer book'],
          traditions: ['sidur sefardí', 'sidur ashkenazi', 'sidur edot mizraj', 'sidur jasídico'],
          types: ['sidur completo', 'sidur diario', 'sidur shabat', 'sidur viaje', 'sidur bolsillo'],
          publishers: ['artscroll', 'kehot', 'koren', 'rinat israel', 'tefila leyisrael'],
          formats: ['grande', 'mediano', 'pequeño', 'bolsillo', 'familiar'],
          languages: ['hebreo', 'español', 'bilingüe', 'fonético', 'interlineal'],
          context: ['oración diaria', 'liturgia', 'rezo', 'spiritual', 'devocional']
        },

        'machzor': {
          primary:'majzor',
          variations: ['machzor', 'libro festividades', 'plegarias fiestas'],
          occasions: ['rosh hashana', 'yom kipur', 'pesaj', 'shavuot', 'sukot'],
          traditions: ['majzor sefardí', 'majzor ashkenazi'],
          context: ['festividades', 'fiestas judías', 'ceremonial', 'especial']
        }
      },

      // ===== ARTÍCULOS RITUALES =====
      tefilin_tallit: {
        'tefilin': {
          primary: 'tefilín',
          variations: ['tefilin', 'phylacteries', 'filacterias', 'cajas de rezo'],
          qualities: ['kosher', 'kasher', 'mehudar', 'simple', 'básico', 'premium', 'certificado'],
          types: ['rashi', 'rabeinu tam', 'ashkenazi', 'sefardí', 'sefaradi'],
          components: ['batim', 'cajas', 'retzuot', 'correas', 'parshiot', 'pergaminos'],
          materials: ['cuero negro', 'cuero natural', 'piel kosher'],
          occasions: ['bar mitzvah', 'adulto', 'diario', 'rezo matutino'],
          sizes: ['adulto', 'bar mitzvah', 'grande', 'mediano'],
          artisans: ['sofer', 'escriba', 'artesano tradicional'],
          context: ['ritual diario', 'mitzvá', 'sagrado', 'tradicional']
        },

        'tallit': {
          primary: 'tallit',
          variations: ['talit', 'manto oración', 'prayer shawl', 'chal rezo', 'manto'],
          types: ['tallit gadol', 'tallit katan', 'tzitzit', 'manto grande', 'camisa tzitzit'],
          materials: ['lana', 'seda', 'algodón', 'lino', 'acrílico', 'mezcla'],
          colors: ['blanco', 'azul', 'negro', 'tradicional', 'rayas azules'],
          qualities: ['kosher', 'mehudar', 'artesanal', 'tradicional', 'elegante'],
          sizes: ['adulto', 'bar mitzvah', 'niño', 'grande', 'mediano', 'pequeño'],
          occasions: ['sinagoga', 'rezo', 'shabat', 'festividades', 'bar mitzvah'],
          context: ['ritual', 'oración', 'cobertura', 'mitzvá', 'sagrado']
        }
      },

      mezuzah_objects: {
        'mezuzah': {
          primary: 'mezuzá',
          variations: ['mezuzah', 'mezuza', 'mezuzot', 'pergamino puerta', 'rollo puerta'],
          components: ['klaf', 'pergamino', 'estuche', 'caja', 'soporte'],
          materials: ['madera', 'metal', 'plata', 'bronce', 'cristal', 'cerámica'],
          styles: ['decorativa', 'simple', 'elegante', 'tradicional', 'moderna', 'artística'],
          sizes: ['10cm', '12cm', '15cm', 'grande', 'mediana', 'pequeña'],
          qualities: ['kosher', 'certificada', 'sofer stam', 'artesanal'],
          texts: ['shema israel', 'parashiot', 'deuteronomio'],
          context: ['protección hogar', 'bendición casa', 'mitzvá', 'entrada']
        },

        'kipa': {
          primary: 'kipá',
          variations: ['kipa', 'kipot', 'yarmulke', 'yarmulka', 'solideo', 'gorro judío', 'kippah'],
          materials: ['terciopelo', 'satén', 'cuero', 'tela', 'algodón', 'seda'],
          styles: ['tejida', 'bordada', 'lisa', 'estampada', 'personalizada'],
          colors: ['negro', 'blanco', 'azul', 'marrón', 'colorido', 'dorado', 'plateado'],
          sizes: ['adulto', 'niño', 'bebé', 'grande', 'mediana', 'pequeña'],
          occasions: ['diaria', 'ceremonial', 'shabat', 'festividades', 'bar mitzvah'],
          context: ['cobertura cabeza', 'respeto', 'tradición', 'identidad']
        }
      },

      ceremonial_items: {
        'menorah': {
          primary: 'menorá',
          variations: ['menorah', 'candelabro', 'candelabro judío', 'luminaria'],
          types: ['menorá 7 brazos', 'janukiá 9 brazos', 'candelabro shabat', 'menorá templo'],
          materials: ['plata', 'bronce', 'latón', 'metal', 'madera', 'cristal'],
          styles: ['tradicional', 'moderna', 'artística', 'decorativa', 'elegante'],
          sizes: ['grande', 'mediana', 'pequeña', 'familiar', 'personal'],
          occasions: ['shabat', 'janucá', 'festividades', 'ceremonial'],
          context: ['luz', 'santificación', 'belleza', 'tradición']
        },

        'janukia': {
          primary: 'janukiá',
          variations: ['chanukiah', 'menorá janucá', 'candelabro janucá', 'menorá 9 brazos'],
          features: ['shamash', 'vela principal', '8 velas', 'nueve brazos'],
          materials: ['plata', 'bronce', 'metal', 'madera', 'cristal'],
          occasions: ['janucá', 'chanucá', 'hanukkah', 'fiesta luces'],
          context: ['milagro', 'luz', 'festividad', 'tradición']
        },

        'shofar': {
          primary: 'shofar',
          variations: ['cuerno', 'trompeta judía', 'cuerno ritual', 'bocina sagrada'],
          types: ['carnero', 'antílope', 'kudu', 'natural', 'pulido'],
          sizes: ['grande', 'mediano', 'pequeño', '30cm', '40cm', '50cm', '60cm'],
          qualities: ['kosher', 'natural', 'pulido', 'certificado', 'artesanal'],
          occasions: ['rosh hashaná', 'año nuevo', 'festividades', 'llamado espiritual'],
          sounds: ['tekiah', 'shevarim', 'teruah', 'tekiah gedolah'],
          context: ['despertar espiritual', 'llamado', 'arrepentimiento', 'renovación']
        }
      },

      // ===== SHABAT Y FESTIVIDADES =====
      shabat_items: {
        'copa_kidush': {
          primary: 'copa kidush',
          variations: ['copa kiddush', 'cáliz kidush', 'copa vino', 'copa ceremonial'],
          materials: ['plata', 'vidrio', 'cristal', 'metal', 'cerámica'],
          styles: ['elegante', 'tradicional', 'moderna', 'artística', 'decorativa'],
          sizes: ['grande', 'mediana', 'pequeña', 'familiar', 'personal'],
          occasions: ['shabat', 'festividades', 'havdalá', 'ceremonias'],
          context: ['santificación', 'bendición', 'vino', 'ceremonia']
        },

        'candelabros_shabat': {
          primary: 'candelabros shabat',
          variations: ['candelabros', 'porta velas', 'candeleros', 'velas shabat'],
          materials: ['plata', 'bronce', 'metal', 'cristal', 'cerámica'],
          types: ['2 velas', '3 velas', 'múltiples', 'familiar', 'personal'],
          styles: ['clásico', 'moderno', 'elegante', 'decorativo'],
          context: ['luz shabat', 'bendición velas', 'inicio shabat', 'paz hogar']
        },

        'velas_shabat': {
          primary: 'velas shabat',
          variations: ['velas', 'candelas', 'nerot', 'velas ceremoniales'],
          types: ['parafina', 'cera', 'larga duración', 'sin goteo'],
          colors: ['blanco', 'marfil', 'natural'],
          durations: ['3 horas', '4 horas', '6 horas', 'larga duración'],
          context: ['luz', 'bendición', 'ceremonia', 'paz']
        }
      },

      holiday_items: {
        'pesaj': {
          primary: 'artículos pesaj',
          variations: ['pascua judía', 'passover', 'seder pesaj', 'elementos seder'],
          items: ['plato seder', 'keará', 'copa elías', 'hagadá', 'matzá', 'afikomen'],
          foods: ['matzá', 'vino pesaj', 'maror', 'jaroset', 'karpas'],
          context: ['libertad', 'éxodo', 'familia', 'tradición', 'historia']
        },

        'rosh_hashana': {
          primary: 'rosh hashaná',
          variations: ['año nuevo judío', 'rosh hashana', 'cabeza del año'],
          items: ['shofar', 'manzana', 'miel', 'recipiente miel', 'majzor rosh'],
          foods: ['manzana miel', 'dulces', 'granada', 'pescado', 'cabeza'],
          context: ['renovación', 'arrepentimiento', 'dulzura', 'esperanza']
        },

        'januca': {
          primary: 'janucá',
          variations: ['chanucá', 'hanukkah', 'fiesta luces', 'dedicación'],
          items: ['janukiá', 'velas janucá', 'dreidel', 'sevivón', 'gelt', 'aceite'],
          foods: ['latkes', 'sufganiot', 'comida frita', 'dulces'],
          context: ['milagro', 'luz', 'resistencia', 'dedicación', 'templo']
        }
      },

      // ===== JOYERÍA Y ACCESORIOS =====
      jewelry: {
        'estrella_david': {
          primary: 'estrella de david',
          variations: ['magen david', 'escudo david', 'hexagrama', 'estrella judía'],
          types: ['colgante', 'collar', 'pulsera', 'anillo', 'aretes', 'dije'],
          materials: ['plata', 'oro', 'acero inoxidable', 'titanio'],
          styles: ['clásica', 'moderna', 'artística', 'minimalista', 'elegante'],
          sizes: ['grande', 'mediana', 'pequeña', 'delicada'],
          context: ['identidad judía', 'protección', 'orgullo', 'tradición']
        },

        'jai_chai': {
          primary: 'jai',
          variations: ['chai', 'vida', 'símbolo vida', 'letters jai'],
          types: ['colgante jai', 'collar chai', 'pulsera vida', 'anillo chai'],
          meanings: ['vida', 'número 18', 'bendición vida', 'longevidad'],
          context: ['bendición', 'vida larga', 'prosperidad', 'buena suerte']
        },

        'hamsa': {
          primary: 'hamsa',
          variations: ['jamsa', 'mano fátima', 'mano protectora', 'mano bendición'],
          types: ['colgante hamsa', 'pulsera hamsa', 'decoración hamsa'],
          meanings: ['protección', 'bendición', 'suerte', 'mal de ojo'],
          context: ['protección', 'bendición hogar', 'amuleto', 'tradición']
        }
      },

      // ===== TÉRMINOS COMERCIALES JUDAICOS =====
      business_terms: {
        'kosher': {
          primary: 'kosher',
          variations: ['kasher', 'kashrut', 'permitido', 'apto', 'autorizado'],
          certifications: ['vaad hakashrut', 'rabinato', 'supervisión rabínica'],
          types: ['carne', 'lácteo', 'parve', 'pesaj', 'mehudar'],
          context: ['alimentario', 'ritual', 'religioso', 'certificado', 'supervisado']
        },

        'mehudar': {
          primary: 'mehudar',
          variations: ['mehudarim', 'hermoseado', 'embellecido', 'premium', 'superior'],
          context: ['calidad superior', 'belleza', 'excelencia', 'cuidado especial']
        },

        'sofer': {
          primary: 'sofer',
          variations: ['sofrim', 'escriba', 'escritor sagrado', 'sofer stam'],
          specialties: ['tefilín', 'mezuzot', 'sefer torah', 'meguilot'],
          context: ['escritura sagrada', 'tradición', 'artesanía', 'certificación']
        }
      },

      // ===== COMUNIDAD Y TRADICIONES =====
      community_terms: {
        'sefardi': {
          primary: 'sefardí',
          variations: ['sefaradí', 'sefardita', 'sefardim', 'sefarad'],
          origins: ['españa', 'portugal', 'mediterráneo', 'medio oriente'],
          traditions: ['ladino', 'tradición española', 'liturgia sefardí'],
          context: ['tradición', 'costumbres', 'comunidad', 'origen']
        },

        'ashkenazi': {
          primary: 'ashkenazi',
          variations: ['ashkenazí', 'ashkenazim', 'europa oriental'],
          origins: ['alemania', 'polonia', 'rusia', 'europa'],
          traditions: ['yiddish', 'tradición europea', 'liturgia ashkenazi'],
          context: ['tradición', 'costumbres', 'comunidad', 'origen']
        }
      }
    };

    // Índice invertido para búsqueda rápida
    this.searchIndex = this.buildSearchIndex();
  }

  buildSearchIndex() {
    const index = new Map();
    
    for (const [category, items] of Object.entries(this.judiacaKnowledge)) {
      for (const [key, data] of Object.entries(items)) {
        // Indexar término primario
        this.addToIndex(index, data.primary, key, category, 1.0);
        
        // Indexar variaciones
        if (data.variations) {
          data.variations.forEach(variation => {
            this.addToIndex(index, variation, key, category, 0.9);
          });
        }
        
        // Indexar términos relacionados
        if (data.related) {
          data.related.forEach(related => {
            this.addToIndex(index, related, key, category, 0.8);
          });
        }
        
        // Indexar tipos y categorías específicas
        ['types', 'qualities', 'materials', 'styles', 'occasions'].forEach(field => {
          if (data[field]) {
            data[field].forEach(term => {
              this.addToIndex(index, term, key, category, 0.7);
            });
          }
        });
      }
    }
    
    return index;
  }

  addToIndex(index, term, key, category, weight) {
    const normalizedTerm = this.normalizeTerm(term);
    if (!index.has(normalizedTerm)) {
      index.set(normalizedTerm, []);
    }
    index.get(normalizedTerm).push({
      key,
      category,
      weight,
      original: term
    });
  }

  normalizeTerm(term) {
    return term
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  // MÉTODO PRINCIPAL: Expandir sinónimos para búsqueda
  async expandSynonyms(searchText) {
    try {
      const cacheKey = `expand_${searchText}`;
      if (this.synonymCache.has(cacheKey)) {
        const cached = this.synonymCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const expandedTerms = new Set();
      const normalizedText = this.normalizeTerm(searchText);
      
      // Agregar términos originales
      const words = normalizedText.split(/\s+/).filter(word => word.length > 1);
      words.forEach(word => expandedTerms.add(word));

      // Buscar coincidencias exactas y parciales
      for (const word of words) {
        const matches = this.findMatches(word);
        matches.forEach(match => {
          const data = this.getJudaicaData(match.key, match.category);
          if (data) {
            // Agregar variaciones más relevantes
            if (data.variations) {
              data.variations.slice(0, 3).forEach(v => expandedTerms.add(v));
            }
            if (data.related) {
              data.related.slice(0, 2).forEach(r => expandedTerms.add(r));
            }
            if (data.types) {
              data.types.slice(0, 2).forEach(t => expandedTerms.add(t));
            }
          }
        });
      }

      // Buscar frases completas
      const phraseMatches = this.findPhraseMatches(searchText);
      phraseMatches.forEach(match => {
        const data = this.getJudaicaData(match.key, match.category);
        if (data) {
          expandedTerms.add(data.primary);
          if (data.variations) {
            data.variations.forEach(v => expandedTerms.add(v));
          }
        }
      });

      const result = Array.from(expandedTerms)
        .filter(term => term && term.length > 1)
        .slice(0, 20); // Limitar cantidad

      // Cache result
      this.synonymCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      console.log(`🔍 Expandidos: "${searchText}" -> [${result.join(', ')}]`);
      return result;

    } catch (error) {
      console.error('Error expandiendo sinónimos:', error);
      return [searchText];
    }
  }

  findMatches(term) {
    const matches = [];
    const normalizedTerm = this.normalizeTerm(term);
    
    // Búsqueda exacta
    if (this.searchIndex.has(normalizedTerm)) {
      matches.push(...this.searchIndex.get(normalizedTerm));
    }
    
    // Búsqueda parcial
    for (const [indexTerm, entries] of this.searchIndex.entries()) {
      if (indexTerm.includes(normalizedTerm) && indexTerm !== normalizedTerm) {
        matches.push(...entries.map(entry => ({ ...entry, weight: entry.weight * 0.8 })));
      }
    }
    
    return matches.sort((a, b) => b.weight - a.weight);
  }

  findPhraseMatches(phrase) {
    const matches = [];
    const normalizedPhrase = this.normalizeTerm(phrase);
    
    for (const [indexTerm, entries] of this.searchIndex.entries()) {
      if (normalizedPhrase.includes(indexTerm) || indexTerm.includes(normalizedPhrase)) {
        matches.push(...entries);
      }
    }
    
    return matches.sort((a, b) => b.weight - a.weight);
  }

  getJudaicaData(key, category) {
    return this.judiacaKnowledge[category]?.[key] || null;
  }

  // Obtener sinónimos específicos para un término
  async getSynonymsForTerm(term) {
    try {
      const cacheKey = `term_${term}`;
      if (this.synonymCache.has(cacheKey)) {
        const cached = this.synonymCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      const matches = this.findMatches(term);
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        const data = this.getJudaicaData(bestMatch.key, bestMatch.category);
        
        if (data) {
          const result = {
            primary: data.primary,
            variations: data.variations || [],
            related: data.related || [],
            types: data.types || [],
            context: data.context || [],
            category: bestMatch.category,
            confidence: bestMatch.weight
          };

          this.synonymCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });

          return result;
        }
      }

      return null;

    } catch (error) {
      console.error('Error obteniendo sinónimos:', error);
      return null;
    }
  }

  // Detectar categorías de productos en texto
  async detectCategories(text) {
    try {
      const categories = new Set();
      const normalizedText = this.normalizeTerm(text);
      
      // Mapeo de categorías principales
      const categoryKeywords = {
        'libros_torah': ['torah', 'chumash', 'jumash', 'pentateuco', 'tanaj'],
        'libros_breslov': ['breslov', 'emunah', 'jardin', 'shalom arush', 'najman'],
        'libros_religiosos': ['sidur', 'talmud', 'tehilim', 'salmos', 'mishna'],
        'tefilin': ['tefilin', 'phylacteries', 'filacterias', 'cajas rezo'],
        'tallit': ['tallit', 'tzitzit', 'manto oracion'],
        'mezuzah': ['mezuzah', 'pergamino', 'klaf', 'puerta'],
        'kipot': ['kipa', 'yarmulke', 'solideo'],
        'menorah': ['menorah', 'candelabro', 'janukia'],
        'shabat': ['copa kidush', 'velas shabat', 'candelabros'],
        'festividades': ['pesaj', 'rosh hashana', 'januca', 'purim'],
        'joyeria': ['estrella david', 'jai', 'hamsa', 'collar', 'pulsera']
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => normalizedText.includes(keyword))) {
          categories.add(category);
        }
      }

      return Array.from(categories);

    } catch (error) {
      console.error('Error detectando categorías:', error);
      return [];
    }
  }

  // Detectar productos específicos mencionados
  async detectProducts(text) {
    try {
      const products = new Set();
      const matches = this.findPhraseMatches(text);
      
      matches.forEach(match => {
        const data = this.getJudaicaData(match.key, match.category);
        if (data) {
          products.add(data.primary);
        }
      });

      return Array.from(products);

    } catch (error) {
      console.error('Error detectando productos:', error);
      return [];
    }
  }

  // Obtener recomendaciones basadas en un producto
  async getRecommendations(productTerm, limit = 5) {
    try {
      const matches = this.findMatches(productTerm);
      const recommendations = [];

      if (matches.length > 0) {
        const category = matches[0].category;
        const categoryItems = this.judiacaKnowledge[category];

        if (categoryItems) {
          Object.values(categoryItems).forEach(item => {
            if (item.primary !== productTerm) {
              recommendations.push({
                product: item.primary,
                reason: `Relacionado con ${productTerm}`,
                category: category
              });
            }
          });
        }
      }

      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return [];
    }
  }

  // Limpiar cache
  clearCache() {
    this.synonymCache.clear();
    console.log('🧹 Cache de sinónimos limpiado');
  }

  // Estadísticas
  getStats() {
    const totalTerms = Object.values(this.judiacaKnowledge)
      .reduce((total, category) => total + Object.keys(category).length, 0);
    
    const categories = Object.keys(this.judiacaKnowledge);
    
    return {
      totalCategories: categories.length,
      totalTerms,
      indexSize: this.searchIndex.size,
      cacheSize: this.synonymCache.size,
      categories: categories.map(cat => ({
        name: cat,
        terms: Object.keys(this.judiacaKnowledge[cat]).length
      }))
    };
  }

  // Validar si un término es conocido
  isKnownTerm(term) {
    const matches = this.findMatches(term);
    return matches.length > 0;
  }

  // Obtener información completa de un producto
  async getProductInfo(term) {
    try {
      const matches = this.findMatches(term);
      
      if (matches.length > 0) {
        const bestMatch = matches[0];
        const data = this.getJudaicaData(bestMatch.key, bestMatch.category);
        
        if (data) {
          return {
            ...data,
            category: bestMatch.category,
            confidence: bestMatch.weight,
            searchTerm: term
          };
        }
      }

      return null;

    } catch (error) {
      console.error('Error obteniendo info producto:', error);
      return null;
    }
  }
}