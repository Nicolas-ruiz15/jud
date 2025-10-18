// lib/chatbot/ultra-comprehensive-intent-system.js - SISTEMA ULTRA-POTENTE V2.0
// Maneja TODAS las posibles consultas para tienda judaica ortodoxa

export class UltraComprehensiveIntentSystem {
  constructor() {
    this.intentDefinitions = {
      
      // ===== SALUDOS Y CORTESÍA - COMPLETAMENTE EXPANDIDO =====
      greeting: {
        patterns: [
          /^(hola|hello|hi|hey|shalom|paz|buenos?\s+(días?|tardes?|noches?))$/i,
          /^(que\s+tal|cómo\s+está[ns]?|cómo\s+andan|qué\s+onda|qué\s+hubo)$/i,
          /^(buenas|saludos|bendiciones|baruch\s+hashem|bendito\s+sea)$/i,
          /^(shalom\s+aleichem|aleichem\s+shalom|gut\s+shabbos|gut\s+yom\s+tov)$/i,
          /^(boker\s+tov|laila\s+tov|chag\s+sameach)$/i
        ],
        fullPhrases: [
          "hola", "buenos días", "buenas tardes", "buenas noches", "shalom",
          "que tal", "como estas", "como están", "saludos", "bendiciones",
          "shalom aleichem", "boker tov", "gut shabbos", "baruch hashem"
        ],
        responses: {
          primary: "¡Shalom! Bienvenido a Judaica Breslov Colombia",
          variations: [
            "¡Baruch Hashem! ¿En qué puedo ayudarte hoy?",
            "¡Shalom Aleichem! Especialistas en productos judaicos auténticos",
            "¡Bendiciones! ¿Qué producto judaico necesitas?"
          ]
        },
        confidence: 0.98,
        category: 'social'
      },

      // ===== LIBROS RELIGIOSOS - ULTRA DETALLADO =====
      
      // TORAH Y CHUMASH
      torah_chumash_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay|me\s+interesa)\s+(?:un\s+|el\s+|la\s+)?(?:libro\s+de\s+)?(?:torah?|torá|pentateuco|cinco\s+libros|chumash|jumash|humash)/i,
          /(?:torah?\s+(?:explicada|comentada|con\s+comentarios|con\s+rashi|bilingüe))/i,
          /(?:bereshit|génesis|éxodo|shemot|levítico|vayikra|números|bamidbar|deuteronomio|devarim)/i,
          /(?:parasha|parashat|parshiot|sidra|sefer\s+torah|klaf)/i,
          /(?:la\s+torah\s+explicada|pentateuco\s+comentado|cinco\s+libros\s+de\s+moisés)/i
        ],
        fullPhrases: [
          "busco torah", "necesito chumash", "quiero jumash con rashi",
          "precio de la torah explicada", "tienen pentateuco comentado",
          "libro de bereshit", "torah bilingue", "chumash con comentarios",
          "jumash hebreo español", "cinco libros de moises"
        ],
        entities: {
          products: ['torah', 'chumash', 'jumash', 'pentateuco'],
          variations: ['torah explicada', 'chumash rashi', 'jumash bilingüe'],
          commentaries: ['rashi', 'ramban', 'ibn ezra', 'sforno'],
          books: ['bereshit', 'shemot', 'vayikra', 'bamidbar', 'devarim']
        },
        confidence: 0.98,
        category: 'books_torah'
      },

      // TANAJ COMPLETO
      tanaj_bible_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+|el\s+)?(?:tanaj|tanakh|biblia\s+hebrea|escrituras\s+hebreas)/i,
          /(?:neviim|ketuvim|profetas|escritos|hagiógrafo|salmos|proverbios|job)/i,
          /(?:biblia\s+original|antiguo\s+testamento\s+hebreo|escrituras\s+sagradas)/i,
          /(?:samuel|reyes|isaías|jeremías|ezequiel|daniel|oseas|joel)/i,
          /(?:tanaj\s+(?:completo|hebreo|español|bilingüe|con\s+traducción))/i
        ],
        fullPhrases: [
          "busco tanaj completo", "necesito biblia hebrea", "quiero tanaj bilingüe",
          "precio del tanaj", "tienen escrituras hebreas", "biblia original",
          "tanaj hebreo español", "neviim y ketuvim", "profetas y escritos"
        ],
        entities: {
          products: ['tanaj', 'biblia hebrea', 'neviim', 'ketuvim'],
          books: ['samuel', 'reyes', 'isaias', 'jeremias', 'ezequiel', 'salmos']
        },
        confidence: 0.98,
        category: 'books_tanaj'
      },

      // TEHILIM ESPECÍFICO
      tehilim_psalms_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+|el\s+|los\s+)?(?:tehilim|salmos|psalms|libro\s+de\s+salmos)/i,
          /(?:tehilim\s+(?:interlineal|bilingüe|hebreo|español|con\s+traducción|fonético))/i,
          /(?:salmos\s+de\s+david|rey\s+david|libro\s+de\s+david)/i,
          /(?:tehilim\s+(?:completo|grande|pequeño|de\s+bolsillo))/i,
          /(?:salmos\s+(?:comentados|con\s+comentarios|explicados))/i
        ],
        fullPhrases: [
          "busco tehilim", "necesito libro de salmos", "quiero tehilim interlineal",
          "precio de tehilim", "salmos bilingüe", "libro de david",
          "tehilim hebreo español", "salmos completos", "tehilim de bolsillo"
        ],
        entities: {
          products: ['tehilim', 'salmos', 'libro de salmos'],
          variations: ['interlineal', 'bilingüe', 'hebreo', 'fonético', 'bolsillo']
        },
        confidence: 0.98,
        category: 'books_tehilim'
      },

      // BRESLOV ESPECÍFICO - MUY DETALLADO
      books_breslov_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:libros?\s+de\s+)?(?:breslov|breslev|najman|nachman|rabi\s+najman)/i,
          /(?:jardín\s+de\s+la\s+(?:fe|paz)|vivamos\s+con\s+emunah|emuna|emunah)/i,
          /(?:shalom\s+arush|rabino\s+arush|rab\s+arush|r\.\s+arush)/i,
          /(?:en\s+el\s+jardín\s+de\s+la\s+(?:fe|paz)|likutey\s+moharan|sefer\s+hamidot)/i,
          /(?:consejos\s+de\s+rabi\s+najman|enseñanzas\s+de\s+breslov|sabiduría\s+de\s+breslov)/i,
          /(?:mujeres\s+en\s+el\s+jardín|educar\s+con\s+emunah|familia\s+breslov)/i,
          /(?:agua\s+del\s+eden|luz\s+del\s+alma|sendero\s+de\s+la\s+fe)/i
        ],
        fullPhrases: [
          "libros de breslov", "jardín de la fe", "vivamos con emunah",
          "libros de shalom arush", "rabi najman", "en el jardín de la paz",
          "enseñanzas de breslov", "consejos de rabi najman", "literatura breslov",
          "mujeres en el jardín", "educar con emunah", "agua del eden"
        ],
        entities: {
          products: ['breslov', 'jardín de la fe', 'vivamos con emunah', 'en el jardín de la paz'],
          authors: ['shalom arush', 'rabi najman', 'nachman de breslov'],
          topics: ['emunah', 'fe', 'educación', 'familia', 'mujer']
        },
        confidence: 0.99,
        category: 'books_breslov'
      },

      // TALMUD Y MISHNA
      talmud_mishna_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+|el\s+)?(?:talmud|gemara|mishna|mishnah)/i,
          /(?:talmud\s+(?:babilónico|bavli|de\s+jerusalén|yerushalmi|completo))/i,
          /(?:masechet|tratado|shas|mishna\s+berura|kitzur\s+shulchan\s+aruch)/i,
          /(?:código\s+de\s+ley\s+judía|halajá|halakha|ley\s+judía)/i,
          /(?:mishna\s+(?:con\s+comentarios|bilingüe|hebreo))/i
        ],
        fullPhrases: [
          "busco talmud", "necesito mishna", "quiero talmud completo",
          "precio del talmud babilónico", "mishna berura", "tratado de",
          "código de ley judía", "halajá práctica", "kitzur shulchan aruch"
        ],
        entities: {
          products: ['talmud', 'mishna', 'gemara', 'mishna berura', 'kitzur'],
          variations: ['babilónico', 'jerusalén', 'completo', 'bilingüe']
        },
        confidence: 0.95,
        category: 'books_talmud'
      },

      // SIDUR Y PLEGARIAS
      sidur_prayer_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+|el\s+)?(?:sidur|sidurim|libro\s+de\s+(?:rezos?|oraciones|plegarias))/i,
          /(?:sidur\s+(?:sefardí|sefaradi|ashkenazi|ashkenazí|edot\s+mizraj))/i,
          /(?:libro\s+de\s+plegarias|prayer\s+book|siddur)/i,
          /(?:sidur\s+(?:completo|diario|shabat|festividades|de\s+viaje))/i,
          /(?:machzor|majzor|libro\s+de\s+festividades)/i
        ],
        fullPhrases: [
          "busco sidur", "necesito libro de rezos", "quiero sidur sefardí",
          "precio de sidur", "libro de oraciones", "sidur completo",
          "prayer book", "machzor de festividades", "sidur de viaje"
        ],
        entities: {
          products: ['sidur', 'libro de rezos', 'machzor', 'prayer book'],
          traditions: ['sefardí', 'ashkenazi', 'edot mizraj'],
          types: ['completo', 'diario', 'shabat', 'festividades', 'viaje']
        },
        confidence: 0.96,
        category: 'books_sidur'
      },

      // ZOHAR Y CÁBALA
      zohar_kabbalah_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+|el\s+)?(?:zohar|sefer\s+zohar|libro\s+del\s+esplendor)/i,
          /(?:cábala|kabbalah|kabala|cabalá|misticismo\s+judío)/i,
          /(?:zohar\s+(?:completo|traducido|comentado|español))/i,
          /(?:shimon\s+bar\s+iojai|rashbi|rabi\s+shimon)/i,
          /(?:sabiduría\s+oculta|secretos\s+de\s+la\s+torah|misticismo)/i
        ],
        fullPhrases: [
          "busco zohar", "libro del esplendor", "cábala", "zohar completo",
          "misticismo judío", "shimon bar iojai", "sabiduría oculta",
          "secretos de la torah", "zohar traducido"
        ],
        entities: {
          products: ['zohar', 'cábala', 'misticismo'],
          variations: ['completo', 'traducido', 'español', 'comentado']
        },
        confidence: 0.94,
        category: 'books_kabbalah'
      },

      // ===== ARTÍCULOS RITUALES - ULTRA ESPECÍFICO =====

      // TEFILÍN COMPLETAMENTE DETALLADO
      tefilin_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:unos?\s+)?(?:tefilín|tefilin|phylacteries|filacterias)/i,
          /(?:tefilín\s+(?:kosher|kasher|mehudar|simple|básico|premium))/i,
          /(?:cajas\s+de\s+rezo|correas\s+de\s+tefilín|retzuot|batim)/i,
          /(?:tefilín\s+(?:rashi|rabeinu\s+tam|ashkenazi|sefardí|sefaradi))/i,
          /(?:tefilín\s+(?:de\s+cuero|natural|certificado|artesanal))/i,
          /(?:bar\s+mitzvah\s+tefilín|tefilín\s+para\s+bar\s+mitzvah)/i,
          /(?:sofer\s+stam|escritor\s+sagrado|pergamino\s+certificado)/i
        ],
        fullPhrases: [
          "busco tefilín", "necesito tefilín kosher", "tefilín para bar mitzvah",
          "precio de tefilín", "tefilín mehudar", "tefilín rashi",
          "cajas de rezo", "tefilín certificado", "tefilín artesanal"
        ],
        entities: {
          products: ['tefilín', 'phylacteries', 'cajas de rezo'],
          qualities: ['kosher', 'mehudar', 'simple', 'premium', 'certificado'],
          types: ['rashi', 'rabeinu tam', 'ashkenazi', 'sefardí'],
          occasions: ['bar mitzvah', 'adulto', 'juventud']
        },
        confidence: 0.99,
        category: 'ritual_tefilin'
      },

      // TALLIT ULTRA DETALLADO
      tallit_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+)?(?:tallit|talit|tzitzit|zizit|manto\s+de\s+oración)/i,
          /(?:tallit\s+(?:gadol|katan|grande|pequeño|camisa))/i,
          /(?:manto\s+de\s+oración|prayer\s+shawl|chal\s+de\s+rezo)/i,
          /(?:tallit\s+(?:de\s+lana|de\s+seda|de\s+algodón|de\s+lino))/i,
          /(?:tzitzit\s+(?:kosher|certificado|artesanal))/i,
          /(?:tallit\s+(?:blanco|azul|tradicional|elegante))/i,
          /(?:bar\s+mitzvah\s+tallit|tallit\s+para\s+bar\s+mitzvah)/i
        ],
        fullPhrases: [
          "busco tallit", "necesito manto de oración", "tallit gadol",
          "tzitzit kosher", "tallit de lana", "tallit para bar mitzvah",
          "prayer shawl", "tallit blanco", "manto tradicional"
        ],
        entities: {
          products: ['tallit', 'tzitzit', 'manto de oración'],
          sizes: ['gadol', 'katan', 'grande', 'pequeño'],
          materials: ['lana', 'seda', 'algodón', 'lino'],
          colors: ['blanco', 'azul', 'tradicional'],
          occasions: ['bar mitzvah', 'sinagoga', 'diario']
        },
        confidence: 0.99,
        category: 'ritual_tallit'
      },

      // MEZUZAH COMPLETAMENTE ESPECIFICADO
      mezuzah_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:una?\s+)?(?:mezuzah?|mezuzot|mezuza)/i,
          /(?:mezuzah\s+(?:kosher|kasher|decorativa|simple|elegante))/i,
          /(?:pergamino\s+de\s+mezuzah|klaf|rollo\s+para\s+puerta)/i,
          /(?:mezuzah\s+(?:de\s+madera|de\s+metal|de\s+plata|de\s+cristal))/i,
          /(?:estuche\s+para\s+mezuzah|caja\s+para\s+mezuzah)/i,
          /(?:mezuzah\s+(?:grande|mediana|pequeña|\d+cm))/i,
          /(?:shema\s+israel|pergamino\s+certificado|sofer\s+escriba)/i
        ],
        fullPhrases: [
          "busco mezuzah", "necesito mezuzah kosher", "mezuzah decorativa",
          "pergamino certificado", "klaf kosher", "mezuzah de madera",
          "estuche para mezuzah", "mezuzah para casa", "rollo shema israel"
        ],
        entities: {
          products: ['mezuzah', 'klaf', 'pergamino', 'estuche'],
          qualities: ['kosher', 'decorativa', 'certificada', 'artística'],
          materials: ['madera', 'metal', 'plata', 'cristal', 'cerámica'],
          sizes: ['grande', 'mediana', 'pequeña', '10cm', '12cm', '15cm']
        },
        confidence: 0.99,
        category: 'ritual_mezuzah'
      },

      // KIPÁ/YARMULKE DETALLADO
      kipa_yarmulke_inquiry: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:una?\s+)?(?:kipá?|kipot|yarmulk|solideo|gorro\s+judío)/i,
          /(?:kipá\s+(?:tejida|bordada|de\s+terciopelo|de\s+cuero|de\s+satén))/i,
          /(?:yarmulke\s+(?:negro|blanco|azul|colorido))/i,
          /(?:kipá\s+(?:personalizada|con\s+nombre|ceremonial|diaria))/i,
          /(?:solideo\s+judío|gorro\s+religioso|kippah)/i,
          /(?:kipá\s+(?:grande|mediana|pequeña|adulto|niño))/i
        ],
        fullPhrases: [
          "busco kipá", "necesito yarmulke", "kipá tejida", "kipá bordada",
          "gorro judío", "kipá de terciopelo", "kipá personalizada",
          "solideo negro", "kippah", "kipá para niño"
        ],
        entities: {
          products: ['kipá', 'yarmulke', 'solideo', 'kippah'],
          materials: ['tejida', 'bordada', 'terciopelo', 'cuero', 'satén'],
          colors: ['negro', 'blanco', 'azul', 'colorido', 'dorado'],
          sizes: ['adulto', 'niño', 'grande', 'mediana', 'pequeña']
        },
        confidence: 0.98,
        category: 'ritual_kipa'
      },

      // MENORÁ Y JANUKIÁ
      menorah_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:una?\s+)?(?:menorá?h?|candelabro|janukiá?h?)/i,
          /(?:menorá\s+de\s+(?:7|siete|9|nueve)\s+brazos)/i,
          /(?:candelabro\s+(?:de\s+shabat|de\s+januca|judío|religioso))/i,
          /(?:menorá\s+(?:de\s+plata|de\s+bronce|de\s+metal|de\s+madera))/i,
          /(?:janukiá\s+(?:tradicional|moderna|elegante|decorativa))/i,
          /(?:candelabro\s+(?:grande|mediano|pequeño|familiar))/i
        ],
        fullPhrases: [
          "busco menorá", "candelabro de shabat", "janukiá", "menorá 7 brazos",
          "candelabro judío", "menorá de plata", "janukiá tradicional",
          "candelabro de januca", "menorá elegante"
        ],
        entities: {
          products: ['menorá', 'janukiá', 'candelabro'],
          types: ['7 brazos', '9 brazos', 'shabat', 'januca'],
          materials: ['plata', 'bronce', 'metal', 'madera', 'cristal'],
          sizes: ['grande', 'mediano', 'pequeño', 'familiar']
        },
        confidence: 0.98,
        category: 'ritual_menorah'
      },

      // SHOFAR ESPECÍFICO
      shofar_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:un\s+)?(?:shofar|cuerno|trompeta\s+judía)/i,
          /(?:shofar\s+(?:de\s+carnero|de\s+antílope|de\s+kudu|natural))/i,
          /(?:cuerno\s+(?:para\s+rosh\s+hashana|ritual|religioso))/i,
          /(?:shofar\s+(?:grande|mediano|pequeño|\d+cm))/i,
          /(?:shofar\s+(?:kosher|certificado|pulido|artesanal))/i,
          /(?:trompeta\s+del\s+año\s+nuevo|cuerno\s+sagrado)/i
        ],
        fullPhrases: [
          "busco shofar", "shofar de carnero", "cuerno para rosh hashana",
          "shofar kosher", "trompeta judía", "shofar grande", "cuerno ritual"
        ],
        entities: {
          products: ['shofar', 'cuerno', 'trompeta judía'],
          types: ['carnero', 'antílope', 'kudu'],
          sizes: ['grande', 'mediano', 'pequeño', '30cm', '40cm', '50cm'],
          occasions: ['rosh hashana', 'año nuevo', 'festividades']
        },
        confidence: 0.98,
        category: 'ritual_shofar'
      },

      // ===== ARTÍCULOS PARA SHABAT =====
      
      shabat_items_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:artículos?\s+(?:para\s+|de\s+))?shabat/i,
          /(?:copa\s+(?:de\s+)?kidush|copas?\s+kidush|kiddush)/i,
          /(?:candelabros?\s+de\s+shabat|velas\s+de\s+shabat)/i,
          /(?:plato\s+para\s+jalá|cubrejlá|cubrejalá|havdalá)/i,
          /(?:copa\s+de\s+(?:plata|vidrio|cristal|metal))/i,
          /(?:velas\s+de\s+(?:cera|parafina|larga\s+duración))/i,
          /(?:mantel\s+de\s+shabat|servilletas\s+de\s+shabat)/i
        ],
        fullPhrases: [
          "artículos para shabat", "copa kidush", "candelabros de shabat",
          "velas de shabat", "plato para jalá", "havdalá", "copa de plata",
          "mantel de shabat", "juego completo shabat"
        ],
        entities: {
          products: ['copa kidush', 'candelabros', 'velas', 'plato jalá', 'havdalá'],
          materials: ['plata', 'vidrio', 'cristal', 'metal', 'cerámica'],
          sets: ['juego completo', 'set shabat', 'kit básico']
        },
        confidence: 0.97,
        category: 'shabat_items'
      },

      // ===== FESTIVIDADES JUDÍAS =====
      
      rosh_hashana_items: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:artículos?\s+para\s+)?(?:rosh\s+hashana|año\s+nuevo\s+judío)/i,
          /(?:manzana\s+y\s+miel|recipiente\s+para\s+miel|miel\s+kosher)/i,
          /(?:majzor\s+de\s+rosh|libro\s+de\s+rosh\s+hashana)/i,
          /(?:shofar\s+para\s+rosh|cuerno\s+año\s+nuevo)/i,
          /(?:tarjetas\s+de\s+rosh|felicitaciones\s+año\s+nuevo)/i
        ],
        fullPhrases: [
          "artículos rosh hashana", "manzana y miel", "majzor rosh hashana",
          "shofar año nuevo", "recipiente miel", "tarjetas rosh hashana"
        ],
        confidence: 0.96,
        category: 'holidays_rosh'
      },

      pesaj_passover_items: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:artículos?\s+para\s+)?(?:pesaj|pascua\s+judía|passover)/i,
          /(?:plato\s+de\s+seder|keará|seder\s+plate)/i,
          /(?:hagadá|haggadah|libro\s+de\s+pesaj)/i,
          /(?:copa\s+de\s+elías|kos\s+eliyahu|copa\s+del\s+profeta)/i,
          /(?:matzá|matzah|pan\s+ázimo|afikomen)/i,
          /(?:vino\s+kosher\s+pesaj|vino\s+para\s+seder)/i
        ],
        fullPhrases: [
          "artículos pesaj", "plato de seder", "hagadá", "copa de elías",
          "matzá kosher", "vino pesaj", "keará completa", "seder completo"
        ],
        confidence: 0.96,
        category: 'holidays_pesaj'
      },

      januca_hanukkah_items: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:artículos?\s+para\s+)?(?:janucá?|chanucá?|hanukkah)/i,
          /(?:janukiá|chanukiah|menorá\s+de\s+janucá)/i,
          /(?:velas\s+de\s+janucá|shamash|vela\s+principal)/i,
          /(?:dreidel|sevivón|perinola|trompo)/i,
          /(?:gelt|monedas\s+de\s+chocolate|dulces\s+janucá)/i,
          /(?:aceite\s+de\s+oliva|aceite\s+para\s+janucá)/i
        ],
        fullPhrases: [
          "artículos janucá", "janukiá", "velas janucá", "dreidel",
          "monedas chocolate", "aceite oliva", "set janucá completo"
        ],
        confidence: 0.96,
        category: 'holidays_januca'
      },

      // ===== JOYERÍA JUDAICA =====
      
      jewelry_comprehensive: {
        patterns: [
          /(?:busco|necesito|quiero|precio\s+de|tienen|hay)\s+(?:joyería\s+)?(?:judaica|judía|religiosa)/i,
          /(?:collar|cadena|pulsera|anillo|aretes|pendientes)\s+(?:judío|judaico|con\s+estrella|religioso)/i,
          /(?:estrella\s+de\s+david|magen\s+david|hexagrama)/i,
          /(?:jai|chai|vida|símbolo\s+vida)/i,
          /(?:hamsa|mano\s+de\s+fátima|jamsa|mano\s+protectora)/i,
          /(?:colgante|dije|medalla|amuleto)\s+(?:judío|religioso|protector)/i,
          /(?:jerusalén|ciudad\s+santa|kotel|muro\s+lamentos)/i,
          /(?:menorá\s+en\s+joyería|menorá\s+colgante)/i
        ],
        fullPhrases: [
          "joyería judaica", "collar estrella david", "pulsera jai",
          "colgante hamsa", "anillo judío", "aretes religiosos",
          "cadena jerusalén", "dije menorá", "amuleto protector"
        ],
        entities: {
          types: ['collar', 'pulsera', 'anillo', 'aretes', 'colgante'],
          symbols: ['estrella david', 'jai', 'hamsa', 'menorá', 'jerusalén'],
          materials: ['plata', 'oro', 'acero', 'cuero'],
          occasions: ['regalo', 'bar mitzvah', 'bat mitzvah', 'boda']
        },
        confidence: 0.95,
        category: 'jewelry'
      },

      // ===== CONSULTAS DE PRECIOS =====
      
      price_inquiry_specific: {
        patterns: [
          /(?:cuánto\s+(?:cuesta|vale|sale|es)|precio\s+de|valor\s+de|a\s+cómo\s+está)\s+(.+)/i,
          /(?:qué\s+precio\s+tiene|me\s+puedes?\s+decir\s+el\s+precio\s+de)\s+(.+)/i,
          /(?:cuánto\s+me\s+(?:cuesta|sale|vale))\s+(.+)/i,
          /(?:precios?\s+de|valores?\s+de|costos?\s+de)\s+(.+)/i
        ],
        fullPhrases: [
          "cuánto cuesta", "precio de", "qué vale", "cuánto sale",
          "valor de", "qué precio tiene", "cuánto me cuesta"
        ],
        extractProduct: true,
        confidence: 0.98,
        category: 'pricing'
      },

      price_inquiry_general: {
        patterns: [
          /^(?:precios?|lista\s+de\s+precios?|cuánto\s+cuestan?)$/i,
          /^(?:qué\s+precios\s+manejan|rangos?\s+de\s+precios?)$/i,
          /^(?:catálogo\s+de\s+precios|ver\s+precios)$/i
        ],
        fullPhrases: [
          "precios", "lista precios", "catálogo precios", "ver precios"
        ],
        confidence: 0.95,
        category: 'pricing'
      },

      // ===== DISPONIBILIDAD Y STOCK =====
      
      availability_inquiry: {
        patterns: [
          /(?:hay|tienen|manejan|está\s+disponible|en\s+stock)\s+(.+)/i,
          /(?:disponibilidad\s+de|existencia\s+de)\s+(.+)/i,
          /(?:cuándo\s+(?:llega|estará\s+disponible|lo\s+tendrán))\s+(.+)/i,
          /(?:agotado|sin\s+stock|out\s+of\s+stock)\s+(.+)/i
        ],
        fullPhrases: [
          "hay", "tienen", "disponible", "en stock", "cuándo llega",
          "disponibilidad", "existencia", "agotado"
        ],
        extractProduct: true,
        confidence: 0.95,
        category: 'availability'
      },

      // ===== ENVÍOS Y LOGÍSTICA =====
      
      shipping_inquiry: {
        patterns: [
          /(?:envío|envíos|hacen\s+envíos?|entregan|delivery)\s*(?:a\s+(.+))?/i,
          /(?:cuánto\s+(?:cuesta|vale)\s+el\s+envío|precio\s+del\s+envío)\s*(?:a\s+(.+))?/i,
          /(?:tiempo\s+de\s+entrega|cuánto\s+(?:tarda|demora)\s+el\s+envío)/i,
          /(?:transportadora|mensajería|domicilio)/i,
          /(?:envío\s+(?:gratis|gratuito|sin\s+costo))/i
        ],
        fullPhrases: [
          "hacen envíos", "cuánto cuesta envío", "tiempo entrega",
          "envío gratis", "delivery", "transportadora"
        ],
        extractLocation: true,
        confidence: 0.95,
        category: 'shipping'
      },

      // ===== MÉTODOS DE PAGO =====
      
      payment_inquiry: {
        patterns: [
          /(?:formas?\s+de\s+pago|métodos?\s+de\s+pago|cómo\s+(?:pago|puedo\s+pagar))/i,
          /(?:aceptan|reciben)\s+(?:tarjetas?|efectivo|transferencias?|pse)/i,
          /(?:puedo\s+pagar\s+con|se\s+puede\s+pagar\s+con)\s+(.+)/i,
          /(?:cuotas?|financiación|pago\s+a\s+plazos|pago\s+diferido)/i,
          /(?:tarjeta\s+(?:crédito|débito)|visa|mastercard|american\s+express)/i
        ],
        fullPhrases: [
          "formas de pago", "métodos pago", "cómo pagar", "aceptan tarjetas",
          "pago cuotas", "tarjeta crédito", "pse", "efectivo"
        ],
        confidence: 0.95,
        category: 'payment'
      },

      // ===== PROCESO DE COMPRA =====
      
      purchase_process_inquiry: {
        patterns: [
          /(?:cómo\s+(?:compro|comprar|hago\s+un\s+pedido|realizo\s+compra))/i,
          /(?:proceso\s+de\s+compra|pasos\s+para\s+comprar)/i,
          /(?:quiero\s+(?:comprar|hacer\s+un\s+pedido|adquirir))\s+(.+)/i,
          /(?:me\s+interesa\s+(?:comprar|adquirir))\s+(.+)/i,
          /(?:procedimiento\s+compra|cómo\s+es\s+el\s+proceso)/i
        ],
        fullPhrases: [
          "cómo compro", "proceso compra", "quiero comprar",
          "cómo hago pedido", "pasos comprar", "me interesa comprar"
        ],
        extractProduct: true,
        confidence: 0.95,
        category: 'purchase_process'
      },

      // ===== CERTIFICACIÓN KOSHER =====
      
      kosher_certification: {
        patterns: [
          /(?:es\s+kosher|kosher|kasher|certificación\s+kosher)/i,
          /(?:supervisión\s+rabínica|rabino\s+certificador|vaad\s+hakashrut)/i,
          /(?:halal|permitido\s+por\s+la\s+ley\s+judía|autorizado)/i,
          /(?:qué\s+certificación\s+tienen|quién\s+certifica|certificado\s+por)/i,
          /(?:kashrut|leyes\s+alimentarias|ley\s+judía)/i
        ],
        fullPhrases: [
          "es kosher", "certificación kosher", "supervisión rabínica",
          "qué certificación", "quién certifica", "kashrut"
        ],
        confidence: 0.95,
        category: 'kosher_certification'
      },

      // ===== UBICACIÓN Y CONTACTO =====
      
      location_inquiry: {
        patterns: [
          /(?:dónde\s+(?:están|quedan|se\s+encuentran|los\s+encuentro))/i,
          /(?:dirección|ubicación|sede|local\s+físico|tienda\s+física)/i,
          /(?:cómo\s+(?:llegar|llego)|cómo\s+ir)/i,
          /(?:en\s+qué\s+ciudad|en\s+dónde\s+están|qué\s+dirección)/i,
          /(?:tienen\s+tienda|local\s+comercial|punto\s+de\s+venta)/i
        ],
        fullPhrases: [
          "dónde están", "dirección", "ubicación", "cómo llegar",
          "tienda física", "en qué ciudad", "local comercial"
        ],
        confidence: 0.95,
        category: 'location'
      },

      contact_inquiry: {
        patterns: [
          /(?:contacto|contactar|comunicarme|llamar|hablar)/i,
          /(?:teléfono|whatsapp|email|correo|celular)/i,
          /(?:número\s+de\s+(?:teléfono|whatsapp|contacto|celular))/i,
          /(?:hablar\s+con\s+(?:alguien|una\s+persona|un\s+asesor|vendedor))/i,
          /(?:atención\s+al\s+cliente|servicio\s+al\s+cliente)/i
        ],
        fullPhrases: [
          "contacto", "teléfono", "whatsapp", "número contacto",
          "hablar con alguien", "atención cliente", "email"
        ],
        confidence: 0.95,
        category: 'contact'
      },

      // ===== HORARIOS =====
      
      hours_inquiry: {
        patterns: [
          /(?:horarios?\s+de\s+atención|a\s+qué\s+hora\s+abren|horario\s+comercial)/i,
          /(?:hasta\s+qué\s+hora|cuándo\s+cierran|están\s+abierto)/i,
          /(?:atienden\s+(?:los\s+)?(?:sábados?|domingos?|fines\s+de\s+semana))/i,
          /(?:horario\s+de\s+(?:apertura|cierre)|qué\s+días\s+abren)/i
        ],
        fullPhrases: [
          "horarios atención", "qué hora abren", "hasta qué hora",
          "cuándo cierran", "atienden sábados", "horario comercial"
        ],
        confidence: 0.95,
        category: 'hours'
      },

      // ===== REFERENCIAS CONTEXTUALES =====
      
      product_reference: {
        patterns: [
          /^(?:el\s+)?(?:[1-4]|primero|segundo|tercero|cuarto)$/i,
          /^(?:ese|esa|este|esta|el\s+(?:último|anterior))$/i,
          /^(?:me\s+interesa\s+(?:el|la)\s+(?:primero?|segundo))$/i,
          /^(?:quiero\s+(?:el|la|ese|esa|este|esta))$/i
        ],
        fullPhrases: [
          "el 1", "el primero", "ese", "este", "el último", "quiero el primero"
        ],
        requiresContext: true,
        confidence: 0.98,
        category: 'reference'
      },

      // ===== AYUDA Y SOPORTE =====
      
      help_inquiry: {
        patterns: [
          /(?:ayuda|me\s+puedes?\s+ayudar|necesito\s+ayuda|orientación)/i,
          /(?:no\s+(?:entiendo|comprendo)|tengo\s+una\s+(?:duda|pregunta))/i,
          /(?:información|informarme|asesoría|consulta)/i,
          /(?:qué\s+(?:puedes?\s+hacer|me\s+(?:puedes?|pueden)\s+(?:ofrecer|decir)))/i,
          /(?:catálogo|productos\s+disponibles|qué\s+venden)/i
        ],
        fullPhrases: [
          "ayuda", "necesito ayuda", "tengo duda", "información",
          "qué puedes hacer", "catálogo", "qué venden"
        ],
        confidence: 0.90,
        category: 'help'
      },

      // ===== RECOMENDACIONES =====
      
      recommendation_inquiry: {
        patterns: [
          /(?:qué\s+me\s+(?:recomienda[ns]?|aconsejan|sugieren))/i,
          /(?:cuál\s+es\s+(?:mejor|el\s+más\s+popular|recomendado))/i,
          /(?:recomendación|sugerencia|consejo|orientación)/i,
          /(?:para\s+(?:alguien\s+que\s+)?(?:empieza|principiante|novato))/i,
          /(?:qué\s+(?:producto|libro|artículo)\s+(?:recomiendan|es\s+mejor))/i
        ],
        fullPhrases: [
          "qué recomiendan", "cuál es mejor", "necesito recomendación",
          "qué sugieren", "para principiante", "qué aconsejan"
        ],
        confidence: 0.90,
        category: 'recommendation'
      },

      // ===== CONFIRMACIONES =====
      
      affirmation: {
        patterns: [
          /^(?:sí|si|yes|claro|exacto|correcto|perfecto)$/i,
          /^(?:por\s+supuesto|desde\s+luego|efectivamente|así\s+es)$/i,
          /^(?:dale|okay|ok|está\s+bien|de\s+acuerdo)$/i
        ],
        fullPhrases: [
          "sí", "claro", "correcto", "perfecto", "está bien", "de acuerdo"
        ],
        confidence: 0.98,
        category: 'affirmation'
      },

      negation: {
        patterns: [
          /^(?:no|nope|para\s+nada|de\s+ninguna\s+manera)$/i,
          /^(?:ninguno|ninguna|nada\s+de\s+eso)$/i,
          /^(?:incorrecto|no\s+es\s+eso|equivocado)$/i
        ],
        fullPhrases: [
          "no", "para nada", "ninguno", "nada de eso", "incorrecto"
        ],
        confidence: 0.98,
        category: 'negation'
      },

      // ===== QUEJAS Y PROBLEMAS =====
      
      complaint: {
        patterns: [
          /(?:queja|reclamo|problema|inconveniente|molestia)/i,
          /(?:no\s+(?:llegó|funciona|sirve)|defectuoso|dañado|roto)/i,
          /(?:mala\s+calidad|no\s+estoy\s+satisfecho|decepciona)/i,
          /(?:garantía|cambio|reembolso|devolución|devolver)/i,
          /(?:error\s+en|problema\s+con|falla\s+en)/i
        ],
        fullPhrases: [
          "tengo queja", "problema con", "no llegó", "mala calidad",
          "quiero devolver", "garantía", "no funciona", "está dañado"
        ],
        requiresHuman: true,
        confidence: 0.95,
        category: 'complaint'
      },

      // ===== INTENCIÓN DESCONOCIDA =====
      
      unknown: {
        patterns: [],
        fullPhrases: [],
        confidence: 0.10,
        category: 'fallback'
      }
    };

    this.contextMemory = new Map();
    this.phraseMemory = new Map();
  }

  // Método principal de clasificación
  classify(message, sessionId = 'default', conversationContext = {}) {
    const startTime = Date.now();
    console.log(`🎯 CLASIFICANDO MENSAJE ULTRA-COMPREHENSIVO: "${message}"`);
    
    const normalizedMessage = this.normalizeMessage(message);
    const results = [];
    
    // 1. ANÁLISIS DE FRASES COMPLETAS PRIMERO
    const phraseAnalysis = this.analyzeFullPhrase(normalizedMessage);
    if (phraseAnalysis) {
      results.push(phraseAnalysis);
    }
    
    // 2. ANÁLISIS POR PATRONES REGEX
    for (const [intentName, intentDef] of Object.entries(this.intentDefinitions)) {
      if (intentName === 'unknown') continue;
      
      const score = this.calculateIntentScore(normalizedMessage, intentDef);
      if (score > 0) {
        results.push({
          intent: intentName,
          confidence: Math.min(score * intentDef.confidence, 1.0),
          matchType: 'pattern',
          category: intentDef.category,
          subcategory: intentDef.subcategory,
          requiresHuman: intentDef.requiresHuman,
          requiresContext: intentDef.requiresContext
        });
      }
    }
    
    // 3. ORDENAR Y SELECCIONAR
    results.sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = results[0] || {
      intent: 'unknown',
      confidence: 0.1,
      matchType: 'fallback',
      category: 'fallback'
    };
    
    // 4. EXTRAER ENTIDADES
    const entities = this.extractEntitiesFromMessage(message, bestMatch.intent);
    
    // 5. GUARDAR CONTEXTO
    this.saveContext(sessionId, bestMatch, entities, message);
    
    const result = {
      type: bestMatch.intent,
      confidence: bestMatch.confidence,
      entities: entities,
      category: bestMatch.category,
      subcategory: bestMatch.subcategory,
      requiresHuman: bestMatch.requiresHuman || false,
      requiresContext: bestMatch.requiresContext || false,
      matchType: bestMatch.matchType,
      processingTime: Date.now() - startTime,
      alternatives: results.slice(1, 3).map(r => ({
        intent: r.intent,
        confidence: r.confidence
      }))
    };
    
    console.log(`✅ RESULTADO ULTRA: ${result.type} (${(result.confidence * 100).toFixed(1)}%)`);
    return result;
  }

  // Métodos auxiliares (normalizeMessage, analyzeFullPhrase, etc. - igual que el anterior pero mejorados)
  normalizeMessage(message) {
    if (!message || typeof message !== 'string') return '';
    
    return message
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  analyzeFullPhrase(message) {
    for (const [intentName, intentDef] of Object.entries(this.intentDefinitions)) {
      for (const phrase of intentDef.fullPhrases) {
        const similarity = this.calculatePhraseSimilarity(message, phrase);
        if (similarity > 0.85) {
          console.log(`🎯 FRASE DETECTADA: "${phrase}" (${(similarity * 100).toFixed(1)}%)`);
          return {
            intent: intentName,
            confidence: similarity * intentDef.confidence,
            matchType: 'full_phrase',
            category: intentDef.category,
            subcategory: intentDef.subcategory
          };
        }
      }
    }
    return null;
  }

  calculatePhraseSimilarity(phrase1, phrase2) {
    const words1 = phrase1.split(' ');
    const words2 = phrase2.split(' ');
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  calculateIntentScore(message, intentDef) {
    let score = 0;
    
    for (const pattern of intentDef.patterns) {
      if (pattern.test(message)) {
        score += 2.0;
        break;
      }
    }
    
    return Math.min(score, 2.5);
  }

  extractEntitiesFromMessage(message, intentType) {
    const entities = {};
    
    // Extraer productos judaicos específicos
    const products = this.extractJudaicProducts(message);
    if (products.length > 0) {
      entities.products = products;
    }
    
    // Extraer ubicaciones
    if (intentType === 'shipping_inquiry') {
      entities.locations = this.extractLocations(message);
    }
    
    // Extraer referencias
    if (intentType === 'product_reference') {
      entities.reference = this.extractReference(message);
    }
    
    return entities;
  }

  extractJudaicProducts(message) {
    const products = [];
    const judaicaTerms = [
      // Libros expandidos
      'torah', 'torá', 'tanaj', 'tehilim', 'salmos', 'sidur', 'talmud', 'zohar',
      'chumash', 'jumash', 'humash', 'mishna', 'gemara', 'hagadá', 'machzor',
      'breslov', 'najman', 'nachman', 'emunah', 'jardín de la fe', 'vivamos con emunah',
      'shalom arush', 'en el jardín de la paz', 'agua del eden', 'luz del alma',
      
      // Artículos rituales expandidos
      'tefilín', 'tefilin', 'phylacteries', 'filacterias', 'cajas de rezo',
      'tallit', 'talit', 'tzitzit', 'manto de oración', 'prayer shawl',
      'mezuzah', 'mezuza', 'pergamino', 'klaf', 'rollo',
      'kipá', 'kipa', 'yarmulke', 'solideo', 'gorro judío',
      'menorá', 'menorah', 'candelabro', 'janukiá', 'chanukiah',
      'shofar', 'cuerno', 'trompeta judía',
      
      // Shabat expandido
      'copa kidush', 'kiddush', 'candelabros shabat', 'velas shabat',
      'plato jalá', 'havdalá', 'mantel shabat',
      
      // Festividades
      'artículos rosh hashana', 'manzana miel', 'majzor',
      'plato seder', 'keará', 'copa elías', 'matzá',
      'dreidel', 'sevivón', 'gelt', 'monedas chocolate',
      
      // Joyería
      'estrella david', 'magen david', 'jai', 'chai', 'hamsa',
      'collar judío', 'pulsera judaica', 'colgante religioso'
    ];
    
    const messageLower = message.toLowerCase();
    judaicaTerms.forEach(term => {
      if (messageLower.includes(term)) {
        products.push(term);
      }
    });
    
    return [...new Set(products)];
  }

  extractLocations(message) {
    const locations = [];
    const cities = [
      'bogotá', 'bogota', 'medellín', 'medellin', 'cali', 'barranquilla',
      'cartagena', 'bucaramanga', 'pereira', 'manizales', 'armenia',
      'ibagué', 'cúcuta', 'santa marta', 'villavicencio', 'pasto',
      'montería', 'valledupar', 'neiva', 'popayán'
    ];
    
    const messageLower = message.toLowerCase();
    cities.forEach(city => {
      if (messageLower.includes(city)) {
        locations.push(city);
      }
    });
    
    return locations;
  }

  extractReference(message) {
    const referenceMap = {
      '1': 0, 'primero': 0, 'primera': 0,
      '2': 1, 'segundo': 1, 'segunda': 1,
      '3': 2, 'tercero': 2, 'tercera': 2,
      '4': 3, 'cuarto': 3, 'cuarta': 3,
      'último': -1, 'ultima': -1
    };
    
    const messageLower = message.toLowerCase();
    for (const [key, value] of Object.entries(referenceMap)) {
      if (messageLower.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  saveContext(sessionId, intent, entities, message) {
    this.contextMemory.set(sessionId, {
      lastIntent: intent.intent,
      lastEntities: entities,
      lastMessage: message,
      timestamp: Date.now(),
      category: intent.category
    });
  }

  getStats() {
    return {
      totalIntents: Object.keys(this.intentDefinitions).length,
      contextMemorySize: this.contextMemory.size,
      categories: [...new Set(Object.values(this.intentDefinitions).map(i => i.category))],
      version: 'ultra-comprehensive-v2.0'
    };
  }

  clearCache() {
    this.contextMemory.clear();
    this.phraseMemory.clear();
  }
}