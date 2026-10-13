(() => {
  'use strict';

  const proposal = { label: 'Propuesta y decisiones', url: '../docs/propuesta-arquitectura.md' };
  const c4 = { label: 'Modelo C4 y contratos', url: '../docs/c4-arquitectura-propuesta.md' };
  const technology = { label: 'Tecnologías y monorepo', url: '../docs/opciones-tecnologicas.md' };
  const resilience = { label: 'Casos adversos y recuperación', url: '../docs/revision-resiliencia-datos-pos.md' };
  const messaging = { label: 'Decisiones de mensajería', url: '../docs/investigacion-mensajeria-pos.md' };
  const extensions = { label: 'Perfiles y proveedores', url: '../docs/extensibilidad-proveedores-dispositivos.md' };
  const corporate = { label: 'Reutilización corporativa', url: '../docs/analisis-repositorios/aportes-plataforma-corporativa.md' };

  window.POS_REVEAL_CONTENT = {
    title: 'POS corporativo · Arquitectura para construir en equipo',
    chapters: [
      { id: 'producto', title: '01 · Un producto, varios países' },
      { id: 'arquitectura', title: '02 · El mapa del sistema' },
      { id: 'venta', title: '03 · Una venta de principio a fin' },
      { id: 'precios', title: '04 · Precios y ofertas offline' },
      { id: 'sincronizacion', title: '05 · Entregar, ejecutar y recuperar' },
      { id: 'integracion', title: '06 · Integrar sin copiar el ERP' },
      { id: 'monorepo', title: '07 · Organizar el código' },
      { id: 'operacion', title: '08 · Demostrar que funciona' }
    ],
    slides: [
      {
        "id": "un-producto-varios-paises",
        "chapter": "producto",
        "kind": "cover",
        "title": "Un POS corporativo. Varios países.",
        "lead": "Un producto que comparte las reglas de venta y caja, y adapta las diferencias de cada país.",
        "takeaway": "Incorporar un país debe aprovechar el núcleo común, sin crear otro POS.",
        "notes": [
          "La meta principal es una plataforma corporativa reutilizable. La continuidad offline es un requisito dentro de ese producto, junto con integridad, seguridad, experiencia común, reportes y operación.",
          "Chile, Perú y España son el alcance inicial de la propuesta. No se afirma que sus proveedores, contratos o reglas fiscales ya estén homologados.",
          "Esta presentación explica una arquitectura de referencia para desarrollar y validar. Los diagramas, simulaciones y fragmentos de código no acreditan una implementación productiva."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        id: 'ruta-de-aprendizaje', chapter: 'producto', kind: 'outline',
        title: 'De una venta al sistema completo',
        lead: 'Primero entenderemos las responsabilidades. Después seguiremos los datos, el código y la recuperación.',
        items: [
          { kicker: '01–02', title: 'Producto y arquitectura', text: 'Qué compartimos y dónde se ejecuta cada responsabilidad.' },
          { kicker: '03–04', title: 'Venta y precios', text: 'Confirmación local y reglas que funcionan con una versión conocida.' },
          { kicker: '05–06', title: 'Sincronización e integración', text: 'Entrega durable, trabajos, eventos y traducción entre sistemas.' },
          { kicker: '07–08', title: 'Código y operación', text: 'Monorepo, versiones, evidencia y pruebas del piloto.' }
        ],
        takeaway: 'Cada tecnología aparece después del problema que necesita resolver.',
        notes: [
          'Derecha e izquierda, igual que Siguiente y Anterior, recorren las láminas en orden. Espacio avanza por los bloques resaltados del código antes de cambiar de lámina. El índice permite saltar a un tema.',
          'Los laboratorios usan datos sintéticos y permiten recorrer pasos o fallos. No se conectan a bancos, servicios fiscales, colas ni sistemas corporativos.',
          'Conviene detenerse en las preguntas antes de mostrar la respuesta. El objetivo es justificar decisiones, no memorizar nombres de herramientas.'
        ], source: proposal
      },
      {
        "id": "como-aprender-la-arquitectura",
        "chapter": "producto",
        "kind": "cards",
        "title": "Entender el diseño, no memorizar siglas",
        "lead": "Partimos de funciones, objetos y una compra. No necesitas experiencia previa con C4, patrones ni Nx.",
        "items": [
          {
            "title": "Primero: una responsabilidad",
            "text": "Explica qué decisión toma cada parte: mostrar, calcular, guardar o comunicar."
          },
          {
            "title": "Después: una frontera",
            "text": "Identifica quién llama a quién, qué datos cruzan y qué ocurre si falla."
          },
          {
            "title": "Finalmente: un cambio",
            "text": "Ubica una nueva regla o un proveedor distinto sin modificar todo el sistema."
          }
        ],
        "takeaway": "Una explicación está comprendida cuando puedes aplicarla a un caso distinto y justificarla.",
        "notes": [
          "Se asume que la persona reconoce una función, un objeto y un archivo de código. El curso explica frontend, backend, API, base de datos y arquitectura antes de usarlos para leer los diagramas.",
          "Puede dividirse el taller en tres encuentros: producto y mapas; ventas, precios y sincronización; integración, estructura y operación. La duración depende de las preguntas y de los ejercicios.",
          "Pide a cada participante que explique con sus palabras antes de mostrar las respuestas. Los ejercicios son señales de comprensión, no una certificación ni una garantía de que no quedarán dudas.",
          "Nx aparece únicamente para ubicar la herramienta dentro del repositorio. Su configuración y uso práctico quedan fuera del objetivo de esta presentación."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "que-es-arquitectura",
        "chapter": "producto",
        "kind": "cards",
        "title": "Arquitectura: decidir quién hace qué",
        "lead": "Organizamos el sistema para que sus partes colaboren y sus fallos tengan un tratamiento conocido.",
        "items": [
          {
            "title": "Responsabilidad",
            "text": "¿Quién calcula el precio y quién puede confirmar una venta?"
          },
          {
            "title": "Comunicación",
            "text": "¿Qué pide una parte a otra y qué respuesta puede esperar?"
          },
          {
            "title": "Datos y fallos",
            "text": "¿Dónde queda la venta y qué sucede si cerramos la pantalla?"
          }
        ],
        "takeaway": "El dibujo explica estas decisiones. Dibujar rectángulos, por sí solo, no las resuelve.",
        "notes": [
          "Presentar arquitectura mediante estas preguntas concretas, sin empezar por nombres de patrones. En esta propuesta la pantalla recibe la intención; el backend de sucursal valida y confirma; PostgreSQL conserva los registros.",
          "Las decisiones también incluyen consecuencias y alternativas. Confirmar ventas en sucursal facilita continuar sin Internet, pero exige recuperar el servidor si deja de estar disponible.",
          "Un contrato describe qué información recibe una parte, qué resultado ofrece y qué errores puede comunicar. No es una promesa de que nunca falle.",
          "El ejercicio final debería pedir al participante que explique estas responsabilidades con sus propias palabras. Mostrar la definición no demuestra que ya pueda aplicarla."
        ],
        "source": {
          "label": "Propuesta del POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "compra-hilo-conductor",
        "chapter": "producto",
        "kind": "cards",
        "title": "Nuestro ejemplo: vender dos filtros",
        "lead": "Una cajera vende dos filtros. Usaremos esa situación para entender responsabilidades y otros casos identificados en los laboratorios.",
        "items": [
          {
            "kicker": "1",
            "title": "La persona decide",
            "text": "Agrega dos unidades y solicita el cálculo del total."
          },
          {
            "kicker": "2",
            "title": "El sistema comprueba",
            "text": "Evalúa precios vigentes, permisos y condiciones de la operación."
          },
          {
            "kicker": "3",
            "title": "La venta queda registrada",
            "text": "Conserva artículos, importe, moneda y evidencia del pago."
          },
          {
            "kicker": "4",
            "title": "Otros sistemas se enteran",
            "text": "Reciben la información necesaria para reportes e integración."
          }
        ],
        "takeaway": "Primero comprendemos la compra; después ponemos nombre a las piezas que la hacen posible.",
        "notes": [
          "Los filtros y el pago en efectivo son un ejemplo ficticio. La regla fiscal concreta depende del régimen y del documento homologados; registrar una venta no resuelve esa obligación por sí solo.",
          "Dejar claro que el paso de otros sistemas puede quedar pendiente. No introducir todavía outbox, idempotencia ni broker; esos nombres aparecen cuando se explica el problema que resuelven.",
          "Preguntar quién debería calcular el importe definitivo y quién debe conservarlo si la pantalla se cierra. Recoger hipótesis sin exigir vocabulario técnico.",
          "Este recorrido usa el perfil con LAN y servidor de sucursal disponibles. La autonomía frente a otros fallos se delimita más adelante."
        ],
        "source": {
          "label": "Propuesta del POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        id: 'objetivos-del-producto', chapter: 'producto', kind: 'cards',
        title: 'Offline es una parte del desafío',
        lead: 'El producto debe crecer entre países y seguir siendo coherente para usuarios, desarrollo y operación.',
        items: [
          { title: 'Reutilización', text: 'Venta, caja, devoluciones y contratos compartidos entre países.' },
          { title: 'Integridad', text: 'Dinero, documentos e integración con identidades y estados verificables.' },
          { title: 'Experiencia y control', text: 'Una UX común, permisos, reportes y módulos con responsables.' },
          { title: 'Continuidad y evolución', text: 'Capacidades offline aprobadas, recuperación y despliegues compatibles.' }
        ],
        takeaway: 'Superar una prueba sin Internet no demuestra por sí solo un producto corporativo.',
        notes: [
          'La plataforma debe demostrar que un segundo perfil nacional reutiliza los casos de uso y pruebas comunes. También debe sostener cambios de proveedor y evolución del ERP.',
          'La continuidad depende de datos, permisos, medios de pago, fiscalidad, disco y disponibilidad del escritor. Tener una copia local no permite cualquier operación.',
          'Enterprise describe garantías y gobierno comprobables. No equivale a añadir microservicios, brokers o tecnologías al diagrama.'
        ], source: proposal
      },
      {
        id: 'compartir-configurar-extender', chapter: 'producto', kind: 'compare',
        title: 'Compartir, configurar y extender',
        lead: 'La variación tiene un lugar explícito. No se distribuyen condicionales de país por todo el producto.',
        columns: [
          { title: 'Núcleo común', items: ['Casos de uso y reglas compartidas', 'Identidades, dinero y contratos', 'Pruebas de regresión comunes'] },
          { title: 'Perfil aprobado', items: ['País, entidad, sucursal y caja', 'Módulos y permisos compatibles', 'Proveedores ya homologados'] },
          { title: 'Extensión', items: ['Política nacional implementada', 'Adaptador fiscal, pago o ERP', 'Pruebas y homologación propias'] }
        ],
        takeaway: 'Configurar combina capacidades soportadas; una regla nueva puede exigir código y nuevos contratos.',
        notes: [
          'No se promete incorporar cualquier país cambiando un JSON. Una regla nueva puede requerir cambiar dominio, contratos y pruebas, manteniendo una evolución común del producto.',
          'La configuración se resuelve y valida antes de activarla. Una excepción de caja no puede ampliar por sí sola permisos fiscales o de crédito.',
          'Evitar forks por país no significa esconder diferencias. Las variantes legítimas se expresan como políticas y adaptadores con responsables.'
        ], source: extensions
      },
      {
        id: 'recorrido-del-negocio', chapter: 'producto', kind: 'cards',
        title: 'El recorrido que vamos a proteger',
        lead: 'Seguiremos una compra desde el turno del cajero hasta la conciliación del país.',
        items: [
          { kicker: '1', title: 'Preparar', text: 'Abrir turno, validar capacidades y cargar datos autorizados.' },
          { kicker: '2', title: 'Cotizar y cobrar', text: 'Calcular con una versión de precios y resolver el intento de pago.' },
          { kicker: '3', title: 'Confirmar y documentar', text: 'Persistir la venta y entregar el documento permitido.' },
          { kicker: '4', title: 'Integrar y conciliar', text: 'Transmitir, registrar resultados y resolver diferencias.' }
        ],
        takeaway: 'Venta, pago, documento fiscal y asiento ERP son hechos relacionados, con estados distintos.',
        notes: [
          'Una venta puede estar confirmada localmente mientras su integración ERP está pendiente. Eso no significa que deba cobrarse otra vez.',
          'El orden y momento de documentación fiscal se ajustan al régimen y proveedor homologados. La secuencia pedagógica no prescribe un flujo fiscal universal.',
          'La caja actual no administra stock según el alcance informado. Cualquier reserva de inventario pertenece al sistema confirmado como responsable; no se añade aquí por asociación con la palabra POS.'
        ], source: proposal
      },
      {
        "id": "estado-de-las-decisiones",
        "chapter": "producto",
        "kind": "compare",
        "title": "Qué está indicado y qué debe validarse",
        "lead": "Una propuesta clara distingue la dirección elegida de una garantía ya demostrada.",
        "columns": [
          {
            "title": "Dirección indicada",
            "items": [
              "Interfaz de caja web y de escritorio",
              "Código compartido entre aplicaciones",
              "Un producto para varios países"
            ]
          },
          {
            "title": "Recomendación",
            "items": [
              "Confirmar y guardar ventas en sucursal",
              "Integrar con país y ERP después",
              "Separar responsabilidades mediante módulos"
            ]
          },
          {
            "title": "Validación pendiente",
            "items": [
              "Reglas y proveedores de cada país",
              "Recuperación y capacidad operativa",
              "Pruebas y aprobación del piloto"
            ]
          }
        ],
        "takeaway": "La maqueta visual y esta presentación no implementan por sí solas el backend objetivo.",
        "notes": [
          "El documento de propuesta y sus ADR son la fuente de decisión vigente. Las revisiones y diagramas sintetizan esa fuente; no cambian decisiones implícitamente.",
          "RabbitMQ, BullMQ o servicios gestionados son opciones para cargas concretas. Se necesita un motivo, un operador y una prueba antes de incorporarlos.",
          "No se inventan SLA, cantidades de cajas o cifras de rendimiento. Los valores de los ejemplos sirven para comprender comportamiento."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "frontend-y-backend",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "Pantalla y reglas tienen trabajos distintos",
        "lead": "Frontend es la interfaz con la persona. Backend es la aplicación que atiende solicitudes y aplica las reglas.",
        "columns": [
          {
            "title": "Frontend · Angular",
            "items": [
              "Muestra los dos filtros y su cantidad",
              "Recoge la intención de la cajera",
              "Presenta resultados y errores comprensibles"
            ]
          },
          {
            "title": "Backend · Sucursal",
            "items": [
              "Valida usuario, permisos y datos",
              "Calcula y confirma según reglas",
              "Coordina los registros que debe guardar"
            ]
          }
        ],
        "takeaway": "La pantalla puede ayudar a validar; el backend vuelve a comprobar lo que protege el negocio.",
        "notes": [
          "Frontend y backend son responsabilidades de software, no sinónimos de equipo del usuario y nube. El backend propuesto vive en el servidor de la sucursal y puede seguir disponible sin Internet.",
          "Una persona puede alterar una solicitud o usar una versión antigua de la UI. Por eso un botón oculto o un importe calculado en pantalla no constituyen autorización.",
          "Angular es la tecnología indicada para la interfaz. Tauri permite empaquetarla y acceder a capacidades nativas autorizadas; no reemplaza el backend de sucursal.",
          "Evitar que el grupo confunda backend con ERP. Son aplicaciones con responsabilidades distintas; el backend POS puede confirmar el negocio local antes de su integración posterior."
        ],
        "source": {
          "label": "Tecnologías y responsabilidades propuestas",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "api-conversacion-definida",
        "chapter": "arquitectura",
        "kind": "code",
        "title": "API: una forma acordada de pedir y responder",
        "lead": "Una API expone operaciones que otra aplicación puede usar. Aquí la pantalla pide una cotización al backend.",
        "code": {
          "language": "http",
          "label": "Ejemplo ficticio · petición y respuesta de una cotización",
          "source": "POST /quotes\n{ \"sku\": \"FILTRO-01\", \"quantity\": 2 }\n\n200 OK\n{\n  \"quoteId\": \"cot-7\",\n  \"total\": { \"amountMinor\": \"18000\", \"currency\": \"CLP\" }\n}",
          "highlights": "1-2|4-8"
        },
        "takeaway": "La respuesta dice cuánto resulta la cotización. Todavía no afirma que existe una venta pagada.",
        "notes": [
          "Leer el ejemplo en voz alta: el cliente solicita calcular dos unidades del producto; el servidor devuelve el identificador de cotización y el total calculado. Los datos y la ruta son educativos, no una API implementada.",
          "API significa interfaz de programación de aplicaciones. En este ejemplo se usa HTTP y un cuerpo JSON; una API también puede ser una interfaz de código sin red.",
          "POST y /quotes indican operación y ruta; quantity es la cantidad solicitada. El importe de 18.000 CLP es ficticio y podría resultar de las reglas autorizadas que veremos después.",
          "El contrato real debe definir autenticación, campos obligatorios, errores, vigencia y moneda. La muestra los omite para enseñar la conversación, no para proponer una API sin seguridad.",
          "Una respuesta HTTP 200 solo tiene el significado de la operación que estamos realizando. Aquí acredita que se obtuvo una cotización, no que el banco cobró ni que se confirmó una venta."
        ],
        "source": {
          "label": "Modelo C4 del POS",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "base-de-datos-y-memoria",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "¿Qué sigue existiendo al cerrar la pantalla?",
        "lead": "La memoria de una aplicación y su base de datos cumplen funciones diferentes.",
        "columns": [
          {
            "title": "Memoria de la pantalla",
            "items": [
              "Mantiene lo que la UI está mostrando",
              "Puede perderse al cerrar o recargar",
              "No es el registro autorizado de la venta"
            ]
          },
          {
            "title": "PostgreSQL de sucursal",
            "items": [
              "Conserva registros confirmados",
              "Permite consultarlos al volver a abrir",
              "Necesita configuración y recuperación probadas"
            ]
          }
        ],
        "takeaway": "Ver “venta guardada” debe corresponder a una confirmación del backend, no solo a una variable en la UI.",
        "notes": [
          "Una base de datos almacena información estructurada y ofrece operaciones para leerla y modificarla. La recomendación de este POS es PostgreSQL en sucursal, con acceso mediante el backend.",
          "Persistente significa que se espera conservar el dato más allá de la vida del proceso, bajo las garantías de configuración y almacenamiento. No significa que sea imposible perder un disco o todo el sitio.",
          "Más adelante se explica commit: confirmar una transacción. Introducir ahora solamente la diferencia entre dato temporal y registro que la operación reconoce como guardado.",
          "Si la pantalla se cierra antes de recibir la respuesta, el resultado puede requerir consulta. No asumir que cerrar la UI cancela una solicitud que el backend ya recibió."
        ],
        "source": {
          "label": "Propuesta del POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "modulo-proceso-servidor",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "Código organizado, programa en ejecución y equipo",
        "lead": "Un módulo no necesita convertirse en una aplicación independiente ni en un servidor propio.",
        "columns": [
          {
            "title": "Módulo",
            "items": [
              "Agrupa una responsabilidad del código",
              "Ejemplo: reglas de precios",
              "Puede compartir proceso con ventas"
            ]
          },
          {
            "title": "Proceso",
            "items": [
              "Es un programa ejecutándose",
              "Ejemplo: backend de sucursal",
              "Puede contener varios módulos"
            ]
          },
          {
            "title": "Equipo o entorno",
            "items": [
              "Aloja procesos y almacenamiento",
              "Ejemplo: servidor de sucursal",
              "Puede ejecutar backend y worker"
            ]
          }
        ],
        "takeaway": "Tres módulos pueden vivir en un proceso. Dos procesos pueden compartir un equipo.",
        "notes": [
          "Para esta propuesta, ventas, caja y precios pueden ser módulos del mismo backend. El sincronizador es un proceso supervisado separado de la interfaz.",
          "Proceso, contenedor C4 y contenedor Docker no son equivalencias universales. Aquí solo fijamos vocabulario; la definición de contenedor C4 llega después.",
          "Un mismo proceso puede atender muchas conexiones y solicitudes. Un escritor de negocio no significa una sola conexión a PostgreSQL ni un único usuario.",
          "Separar procesos añade comunicación y operación; puede tener sentido por aislamiento o entrega, pero la cantidad de módulos no obliga a hacerlo."
        ],
        "source": {
          "label": "Tecnologías y responsabilidades propuestas",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "responsabilidad-y-contrato",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Responsabilidad y contrato: dos preguntas prácticas",
        "lead": "Una parte tiene un trabajo propio y una forma explícita de colaborar con las demás.",
        "items": [
          {
            "title": "¿Qué decide?",
            "text": "Precios decide el cálculo con sus reglas. La UI no sustituye esa decisión."
          },
          {
            "title": "¿Qué necesita?",
            "text": "Producto, cantidad y contexto autorizado: entradas definidas por el contrato."
          },
          {
            "title": "¿Qué devuelve?",
            "text": "Una cotización identificada, o un error explicado si no puede calcular."
          }
        ],
        "takeaway": "Conocer una pantalla o una tabla no concede permiso para saltarse al responsable.",
        "notes": [
          "Responsabilidad es el trabajo y las decisiones que una parte posee. Contrato es la entrada, el resultado, errores y condiciones de una colaboración.",
          "Un contrato no se reduce a los nombres y tipos de campos. Si una respuesta se llama aprobado, todos deben acordar qué hecho acredita y cuál no.",
          "Usar la compra de dos filtros para identificar participantes: cajera, interfaz, cálculo y almacenamiento. Pedir una frase sobre el trabajo de cada uno.",
          "Este fundamento prepara la explicación de contratos entre países e integraciones. No introduce todavía ACL, fachadas ni reglas Nx, que tienen su propio bloque."
        ],
        "source": {
          "label": "Propuesta del POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "ejercicio-cerrar-interfaz",
        "chapter": "arquitectura",
        "kind": "quiz",
        "title": "Ejercicio · Cerramos la ventana del POS",
        "lead": "El backend ya confirmó la venta de dos filtros en PostgreSQL. El servidor de sucursal sigue funcionando.",
        "question": "¿Qué debería ocurrir al volver a abrir la aplicación?",
        "options": [
          {
            "label": "La venta confirmada continúa registrada y puede consultarse.",
            "correct": true,
            "feedback": "Correcto: el registro vive en PostgreSQL de sucursal. Cerrar la interfaz no borra una venta ya confirmada."
          },
          {
            "label": "Hay que cobrar otra vez porque la pantalla perdió su memoria.",
            "correct": false,
            "feedback": "La memoria de la UI no es la autoridad de una venta confirmada. Volver a cobrar crearía otro efecto."
          },
          {
            "label": "La venta solo existe si alcanzó a llegar al ERP.",
            "correct": false,
            "feedback": "La confirmación local y la integración ERP son etapas distintas. El ERP puede continuar pendiente."
          }
        ],
        "takeaway": "Antes de responder, identifica dónde quedó el registro y qué aplicación sigue disponible.",
        "notes": [
          "Pedir primero una justificación oral. Una elección correcta por azar no demuestra que el participante distinga frontend, backend y base de datos.",
          "El enunciado dice que el backend ya confirmó y que el servidor sigue funcionando. No extrapolar el resultado a un disco destruido o a un servidor inaccesible.",
          "Variante de discusión: si la UI se cerró sin recibir respuesta, consultar la operación identificada antes de crear otra. La incertidumbre de red se desarrolla después."
        ],
        "source": {
          "label": "Propuesta del POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "leer-c4",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "C4: cuatro niveles para responder preguntas distintas",
        "lead": "Ampliamos una parte a la vez. No necesitamos dibujar los cuatro niveles si alguno no aporta una decisión.",
        "items": [
          {
            "kicker": "C1",
            "title": "Contexto",
            "text": "Personas y sistemas. ¿Quién usa el POS y con quién colabora?"
          },
          {
            "kicker": "C2",
            "title": "Contenedores",
            "text": "Aplicaciones y datos. ¿Qué partes ejecutables forman el POS?"
          },
          {
            "kicker": "C3",
            "title": "Componentes",
            "text": "Interior de una aplicación. ¿Qué módulos colaboran en el backend?"
          },
          {
            "kicker": "C4",
            "title": "Código",
            "text": "Interior de un componente. ¿Qué clases o funciones lo implementan?"
          }
        ],
        "takeaway": "Despliegue es una vista complementaria: ubica instancias en equipos o entornos; no es el nivel C4.",
        "notes": [
          "C4 permite elegir el grado de detalle que responde a la pregunta del equipo. Contexto y contenedores suelen ser un punto de partida suficiente; no producir cuatro diagramas por obligación.",
          "En nuestra propuesta C1 explica el producto y su entorno; C2 divide aplicaciones y datos; C3 amplía backend y sincronizador. No se dibujan clases definitivas que aún no se diseñaron.",
          "Un pequeño fragmento de código educativo no constituye por sí solo un modelo C4 de código. Esa vista tendría como alcance un componente y mostraría los elementos relevantes de su implementación.",
          "Comprobar comprensión pidiendo una elección de vista: para saber quién usa el POS, C1; para saber dónde vive el backend, despliegue; para sus módulos, C3.",
          "Referencias verificadas: https://c4model.com/diagrams y https://c4model.com/diagrams/code. La vista de despliegue se define por separado en https://c4model.com/diagrams/deployment."
        ],
        "source": {
          "label": "C4 oficial · Niveles y vistas complementarias",
          "url": "https://c4model.com/diagrams"
        }
      },
      {
        "id": "c4-contenedor-no-es-docker",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "Contenedor C4: una aplicación o un almacén",
        "lead": "El término describe una pieza del sistema. No exige usar Docker.",
        "columns": [
          {
            "title": "Ejemplos del POS",
            "items": [
              "Aplicación de caja Angular + Tauri",
              "Backend de sucursal",
              "Datos guardados en PostgreSQL"
            ]
          },
          {
            "title": "Otra pregunta: despliegue",
            "items": [
              "¿En qué equipo se ejecuta?",
              "¿Cuántas instancias hay?",
              "¿Se usa Docker, VM o proceso nativo?"
            ]
          }
        ],
        "takeaway": "C2 organiza aplicaciones y datos. Despliegue explica dónde y cómo ejecutamos sus instancias.",
        "notes": [
          "La definición oficial de contenedor C4 abarca aplicaciones y almacenes de datos. No exige una correspondencia uno a uno con un proceso del sistema operativo o un contenedor Docker.",
          "Una biblioteca de reglas dentro del backend normalmente no es un contenedor C4 separado; organiza código que ejecuta una aplicación.",
          "La misma aplicación puede instalarse de manera distinta en desarrollo y producción sin dejar de representar la misma responsabilidad del modelo.",
          "Fuente oficial consultada para este material: https://c4model.com/abstractions/container y la vista complementaria https://c4model.com/diagrams/deployment."
        ],
        "source": {
          "label": "C4 oficial · Qué es un contenedor",
          "url": "https://c4model.com/abstractions/container"
        }
      },
      {
        "id": "leer-limites-c4",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Antes de seguir una flecha, lee el borde",
        "lead": "El título y el alcance explican qué representa cada caja del dibujo.",
        "items": [
          {
            "title": "Nombre y tipo",
            "text": "¿Es una persona, un sistema, una aplicación, un dato o un componente?"
          },
          {
            "title": "Responsabilidad",
            "text": "Lee el verbo: calcula, confirma, almacena o transmite."
          },
          {
            "title": "Límite",
            "text": "Un borde puede encerrar el sistema o un proceso. No lo deduzcas solo por su tamaño."
          }
        ],
        "takeaway": "En nuestro C3, “Backend de sucursal” encierra módulos que comparten proceso.",
        "notes": [
          "La notación debe explicar tipos, responsabilidades y fronteras. El color es una ayuda, no una propiedad universal de C4.",
          "Aplicación al POS: en contexto el POS es un sistema; en C2 se muestran sus aplicaciones; en C3 se amplía un backend. No son tres sistemas nuevos creados al hacer zoom.",
          "El mapa simplificado omite detalles. Un elemento no dibujado en una vista no deja de existir; consultar el alcance antes de sacar conclusiones sobre seguridad o ejecución.",
          "Para comprobar lectura, pedir que el participante nombre el alcance del diagrama antes de identificar un módulo."
        ],
        "source": {
          "label": "C4 oficial · Cómo leer la notación",
          "url": "https://c4model.com/diagrams/notation"
        }
      },
      {
        "id": "leer-flechas-c4",
        "chapter": "arquitectura",
        "kind": "code",
        "title": "Una flecha expresa una relación con propósito",
        "lead": "Lee origen, acción y destino. El protocolo aclara cómo se comunican aplicaciones diferentes.",
        "code": {
          "language": "plaintext",
          "label": "Relación de ejemplo · se lee de izquierda a derecha",
          "source": "Cliente POS\n    ── solicita una cotización por HTTPS ──▶\nBackend de sucursal",
          "highlights": "1-3"
        },
        "takeaway": "Esta flecha no cuenta todos los pasos de la compra ni demuestra que la venta quedó guardada.",
        "notes": [
          "El origen solicita y el destino atiende en esta relación. No invertir la flecha solamente porque la respuesta vuelve al cliente: hay que nombrar el propósito representado.",
          "Las vistas C4 de estructura describen relaciones. Un recorrido temporal necesita pasos o una secuencia, como los laboratorios de venta que aparecen después.",
          "En el ejemplo se usa HTTPS como protocolo ilustrativo entre aplicaciones. Dentro del mismo proceso puede haber una llamada de código sin HTTP.",
          "Las etiquetas deben ayudar a entender qué intercambio ocurre. Evitar interpretar una línea con el texto usa como evidencia de persistencia, autorización o éxito de negocio."
        ],
        "source": {
          "label": "C4 oficial · Cómo leer la notación",
          "url": "https://c4model.com/diagrams/notation"
        }
      },
      {
        "id": "ejercicio-leer-relacion",
        "chapter": "arquitectura",
        "kind": "quiz",
        "title": "Ejercicio · ¿Qué demuestra esta relación?",
        "lead": "Cliente POS → Backend de sucursal. Etiqueta: “Solicita cotización por HTTPS”.",
        "question": "¿Cuál de estas afirmaciones está respaldada por el dibujo?",
        "options": [
          {
            "label": "El cliente puede pedir una cotización al backend mediante ese protocolo.",
            "correct": true,
            "feedback": "La dirección y la etiqueta describen esa colaboración. El detalle del resultado pertenece al contrato."
          },
          {
            "label": "La venta ya se guardó y el ERP recibió el pago.",
            "correct": false,
            "feedback": "La flecha de cotización no afirma confirmación, persistencia ni integración. Son responsabilidades diferentes."
          },
          {
            "label": "El cliente y el backend se ejecutan obligatoriamente en el mismo equipo.",
            "correct": false,
            "feedback": "La relación no fija el equipo de ejecución. Esa información se explica en la vista de despliegue."
          }
        ],
        "takeaway": "Leer un diagrama también consiste en reconocer qué información todavía no ofrece.",
        "notes": [
          "Pedir al participante que señale la palabra del dibujo que justifica su respuesta. Esto distingue una lectura fundada de una suposición.",
          "La pregunta no requiere memorizar C4. Se resuelve leyendo origen, acción y destino y evitando inferir estados que el gráfico no representa.",
          "Si el grupo duda, volver al ejemplo API: cotizar entrega un cálculo; no significa cobrar ni confirmar una venta."
        ],
        "source": {
          "label": "Modelo C4 del POS",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "guia-lectura-contexto-pos",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Ahora lee el mapa del POS con tres preguntas",
        "lead": "En el próximo C1, busca personas y sistemas. Todavía no busques tablas ni clases.",
        "items": [
          {
            "kicker": "1",
            "title": "¿Quién lo utiliza?",
            "text": "Ubica cajera, supervisor y equipo que configura u opera la plataforma."
          },
          {
            "kicker": "2",
            "title": "¿Cuál es nuestro sistema?",
            "text": "Localiza POS corporativo: esa caja representa el producto que estamos diseñando."
          },
          {
            "kicker": "3",
            "title": "¿Con quién colabora?",
            "text": "Encuentra fuentes de precios, pagos, fiscalidad y sistemas empresariales."
          }
        ],
        "takeaway": "Para la compra de dos filtros, explica quién opera y qué sistemas aportan capacidades.",
        "notes": [
          "Después de esta lámina pasar a C1 y dar tiempo para localizar las tres respuestas. El diagrama de contexto privilegia personas y sistemas, no clases o infraestructura.",
          "Respuesta esperada aplicada a nuestra propuesta: la cajera usa el POS; el POS utiliza datos y se relaciona con autoridades de pago, fiscalidad y sistemas empresariales. La fuente autorizada de cada maestro debe confirmarse por país.",
          "El pago en efectivo de nuestro ejemplo no requiere una autorización bancaria remota. La relación con pagos refleja las capacidades del producto, no que se invoquen todas en cada venta.",
          "Los sistemas empresariales AX, Gira y custom corresponden a países distintos. El C1 no afirma que una venta se registre en los tres."
        ],
        "source": {
          "label": "C4 oficial · Contexto del sistema",
          "url": "https://c4model.com/diagrams/system-context"
        }
      },
      {
        "id": "contexto-del-pos",
        "chapter": "arquitectura",
        "kind": "diagram",
        "diagramKey": "context",
        "title": "C1 · El POS y sus fronteras",
        "lead": "Busca primero personas, luego el POS y después sus colaboradores. Este mapa responde quién participa, no cómo se implementa.",
        "takeaway": "Explica una relación completa: persona o sistema de origen, propósito y destino.",
        "notes": [
          "El cajero opera, el supervisor autoriza y revisa, y el equipo de plataforma supervisa entregas y recuperaciones. Son necesidades diferentes, no un único permiso administrador.",
          "La autoridad de catálogo y precios se confirma por atributo y país. No se adjudica automáticamente al ERP ni a la sucursal que guarda el espejo.",
          "Chile integra Dynamics AX on-premise; España, Gira; Perú, un sistema custom, según los antecedentes. Interfaces y capacidades de los destinos requieren validación.",
          "El documento fiscal, la liquidación del pago y el asiento contable no quedan demostrados por el ACK del POS central."
        ],
        "source": {
          "label": "Modelo C4 y contratos",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "modulos-antes-que-servidores",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "Separar responsabilidades no exige más servidores",
        "lead": "La propuesta agrupa reglas de sucursal en un backend modular y separa la comunicación con país y ERP.",
        "columns": [
          {
            "title": "Módulos en un proceso",
            "items": [
              "Ventas, caja y precios tienen límites de código.",
              "Pueden coordinar una transacción local.",
              "Se despliegan juntos; un fallo puede afectarlos a todos."
            ]
          },
          {
            "title": "Servicios separados",
            "items": [
              "Permiten operar y desplegar capacidades por separado.",
              "Añaden red, fallos parciales y compatibilidad de mensajes.",
              "Compartir una transacción ya no es automático."
            ]
          },
          {
            "title": "Criterio del POS",
            "items": [
              "Proteger la operación local de la caída de WAN.",
              "Integrar ERP después mediante trabajo durable.",
              "Separar más procesos si existe una necesidad demostrable."
            ]
          }
        ],
        "takeaway": "Elige una frontera por su responsabilidad y sus fallos, no por la cantidad de cajas en el diagrama.",
        "notes": [
          "Un monolito modular es una aplicación con módulos internos y contratos explícitos. No significa una única clase ni acceso libre a las tablas de todos los módulos.",
          "Un servicio se ejecuta separado y expone una frontera de comunicación; introduce costes de despliegue, supervisión, compatibilidad y recuperación.",
          "No es una prohibición de microservicios: una necesidad concreta de aislamiento, escala o propiedad puede justificar la separación. El dibujo C4 documenta la decisión, no la toma.",
          "La transacción solo incluye recursos que participan en ella. Una llamada a pago o ERP no queda dentro del commit SQL por estar invocada desde la misma aplicación."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "job-cola-worker-desde-cero",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Trabajo, lista de espera y ejecutor",
        "lead": "Estos tres nombres aparecerán en los diagramas. Juntos permiten ejecutar trabajo después de la petición inicial.",
        "items": [
          {
            "kicker": "1 · Job",
            "title": "Una tarea identificada",
            "text": "Describe qué hacer, para quién y con qué identidad. Ejemplo: preparar precios para una sucursal."
          },
          {
            "kicker": "2 · Cola",
            "title": "Trabajo pendiente",
            "text": "Conserva tareas hasta que un ejecutor esté disponible. Su recuperación debe configurarse y comprobarse."
          },
          {
            "kicker": "3 · Worker",
            "title": "El proceso ejecutor",
            "text": "Toma una tarea, la ejecuta y registra el resultado. Puede continuar aunque el cajero cierre la ventana."
          },
          {
            "kicker": "Ejemplo",
            "title": "La misma responsabilidad",
            "text": "El planificador crea el job; la cola espera; el worker construye el paquete y registra cómo terminó."
          }
        ],
        "takeaway": "Un job puede reejecutarse: el efecto de negocio necesita protección contra duplicados.",
        "notes": [
          "Una cola no tiene que ser RabbitMQ o BullMQ desde el primer día. La propuesta base utiliza registros durables y workers; se añaden herramientas cuando existe un motivo comprobado.",
          "Un worker es un proceso, no una persona ni una función del navegador. Supervisión significa que su estado y reinicio tienen un responsable operativo.",
          "Este ejemplo todavía no detalla reintentos ni idempotencia. Esas reglas se observarán en los laboratorios después de entender el vocabulario.",
          "Una tarea identificada: «Preparar el paquete de precios de esta sucursal». Guarda qué hacer, para quién, con qué parámetros y con qué identidad. No es el proceso que la ejecuta.",
          "Trabajo pendiente: Conserva tareas hasta que puedan ejecutarse. Permite absorber un pico sin exigir que todos los ejecutores trabajen a la vez. Debemos configurar y comprobar su recuperación.",
          "El proceso ejecutor: Toma una tarea, realiza el trabajo y registra el resultado. Puede vivir separado de la interfaz y seguir trabajando aunque el cajero cierre la ventana.",
          "La misma responsabilidad: Un planificador crea el job; la cola lo deja pendiente; un worker construye el paquete. El resultado se registra para saber si terminó, falló o debe revisarse."
        ],
        "source": {
          "label": "Colas y ejecución diferida · Microsoft",
          "url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/queue-based-load-leveling"
        }
      },
      {
        "id": "commit-y-ack-desde-cero",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Guardar y avisar son dos acciones",
        "lead": "Primero distinguimos qué ocurrió en la base y qué respuesta vio quien envió la operación.",
        "items": [
          {
            "kicker": "1 · Transacción",
            "title": "Cambios que van juntos",
            "text": "Venta, movimiento y pendiente de envío se confirman todos o ninguno dentro de esa base."
          },
          {
            "kicker": "2 · Commit",
            "title": "La base confirma",
            "text": "PostgreSQL confirma los cambios locales. Esto no confirma otra base ni un cobro externo."
          },
          {
            "kicker": "3 · ACK",
            "title": "El receptor avisa",
            "text": "País avisa después de su commit. El aviso puede perderse aunque los datos ya estén guardados."
          },
          {
            "kicker": "4 · Recuperación",
            "title": "No adivinar el resultado",
            "text": "Conservamos la identidad y recuperamos el resultado. Otro ID impediría reconocer el mismo evento."
          }
        ],
        "takeaway": "Commit es confirmación dentro de una base. ACK es un aviso con un alcance definido.",
        "notes": [
          "La transacción no engloba por magia a PostgreSQL, un banco y el ERP. Cada sistema tiene su propia confirmación; el flujo debe coordinar evidencias y estados.",
          "La propiedad todos o ninguno se refiere a cambios dentro de la transacción de esa base. Durabilidad, recuperación y configuración requieren validación operativa.",
          "Un ACK del broker, uno del consumidor y uno de la API POS no acreditan lo mismo. Los laboratorios mostrarán quién emite cada uno y después de qué persistencia.",
          "Cambios que van juntos: Agrupa venta, movimiento de caja y pendiente de envío. En esa base se confirman todos o ninguno; así no queda una venta confirmada sin su trabajo de entrega.",
          "La base confirma: PostgreSQL confirma esos cambios bajo su configuración de durabilidad. La venta ya existe localmente. Esto no confirma una escritura en otra base ni un cobro externo.",
          "El receptor avisa: Un acuse responde qué aceptó el receptor. En el protocolo propuesto, país responde después de su commit. Ese mensaje puede perderse aunque el commit haya ocurrido.",
          "No adivinar el resultado: Si falta el acuse, conservamos la identidad y recuperamos el resultado. Reenviar el mismo evento permite reconocerlo; inventar otro ID oculta que es la misma operación."
        ],
        "source": {
          "label": "Transacciones · PostgreSQL",
          "url": "https://www.postgresql.org/docs/current/tutorial-transactions.html"
        }
      },
      {
        "id": "outbox-inbox-desde-cero",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Recordar qué enviar y qué ya recibimos",
        "lead": "Outbox e inbox son registros que ayudan a recuperarnos si un proceso o la conexión falla.",
        "items": [
          {
            "title": "Outbox · registro de salida",
            "text": "La sucursal guarda la venta y su pendiente de envío juntos. Un worker consulta ese pendiente aunque la aplicación se reinicie."
          },
          {
            "title": "Inbox · registro de entrada",
            "text": "País registra la identidad recibida junto con su efecto local. Un reenvío reconocido no vuelve a aplicar ese mismo efecto."
          },
          {
            "title": "Cada frontera tiene su alcance",
            "text": "Guardar en país no demuestra que el ERP registró la venta. Esa integración conserva su propio pendiente y resultado."
          }
        ],
        "takeaway": "El registro durable permite recuperar el trabajo; una cola o una petición HTTP por sí solas no resuelven todas las fronteras.",
        "notes": [
          "Son patrones de datos, no nombres obligatorios de tablas ni productos que deban instalarse.",
          "La garantía depende de la transacción, claves únicas, retención y recuperación. No promete un único efecto en un proveedor remoto que no coopera.",
          "Si el receptor restaura un estado anterior, necesita reconstruir y conciliar su historial antes de interpretar los reenvíos."
        ],
        "source": {
          "label": "Propuesta y límites de confirmación",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "esperar-o-continuar",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "¿Necesito el resultado para continuar?",
        "lead": "Síncrono y asíncrono describen cómo coordinamos un resultado. No dicen si una operación fue exitosa.",
        "columns": [
          {
            "title": "Síncrono: espero",
            "items": [
              "El POS solicita calcular esta cesta.",
              "Espera el importe o un error antes de mostrar el total.",
              "La respuesta pertenece a esa petición."
            ]
          },
          {
            "title": "Asíncrono: queda pendiente",
            "items": [
              "La sucursal confirma una venta local.",
              "Guarda trabajo para enviarla a país después.",
              "Otro proceso ejecuta y registra el resultado."
            ]
          },
          {
            "title": "La decisión",
            "items": [
              "Esperar cuando necesito ese resultado ahora.",
              "Diferir solo cuando negocio permite esperar.",
              "Mostrar pendiente sin presentarlo como terminado."
            ]
          }
        ],
        "takeaway": "Asíncrono significa resultado posterior, no trabajo olvidado ni éxito automático.",
        "notes": [
          "Pedir al equipo un ejemplo cotidiano: esperar el total para cobrar frente a enviar después un informe ya generado. La analogía explica coordinación, no garantías de persistencia.",
          "No confundir esto con la palabra async de JavaScript. Una función async puede esperar una petición cuyo resultado el usuario necesita antes de continuar.",
          "La propuesta permite diferir integración ERP, pero no declarar autorizado un pago cuyo resultado se desconoce. El contrato de cada operación fija qué puede quedar pendiente."
        ],
        "source": {
          "label": "Coordinación asíncrona · Microsoft",
          "url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/asynchronous-request-reply"
        }
      },
      {
        "id": "comando-y-evento-desde-cero",
        "chapter": "arquitectura",
        "kind": "compare",
        "title": "Pedir algo y contar que ocurrió",
        "lead": "Los mensajes tienen intención. Distinguirla evita tratar una solicitud como un hecho confirmado.",
        "columns": [
          {
            "title": "Comando: una petición",
            "items": [
              "«Confirma esta venta».",
              "Se dirige al responsable de aceptarla o rechazarla.",
              "Todavía no afirma que la venta exista."
            ]
          },
          {
            "title": "Evento: un hecho",
            "items": [
              "«La venta 901 fue confirmada».",
              "Lo publica quien confirmó ese hecho.",
              "Puede interesar a integración y reportes."
            ]
          },
          {
            "title": "En nuestro POS",
            "items": [
              "La UI manda el comando a sucursal.",
              "Sucursal valida y confirma en su base.",
              "Después distribuye el evento con identidad estable."
            ]
          }
        ],
        "takeaway": "Un evento de venta confirmada no dice que el ERP ya la contabilizó.",
        "notes": [
          "Leer los nombres en voz alta: ConfirmarVenta pide una acción; VentaConfirmada describe algo pasado. La gramática ayuda a identificar el contrato.",
          "Un comando también puede viajar por una cola. Un evento puede entregarse por HTTP. La diferencia es el significado, no el transporte ni el formato JSON.",
          "Un consumidor de VentaConfirmada no vuelve a ejecutar el cobro: utiliza el hecho para su propia responsabilidad. La venta conserva la sucursal autora."
        ],
        "source": {
          "label": "Contratos y propiedad de datos POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "guia-lectura-contenedores-pos",
        "chapter": "arquitectura",
        "kind": "cards",
        "title": "Abrimos la caja “POS corporativo”",
        "lead": "El próximo C2 muestra qué aplicaciones colaboran dentro del producto.",
        "items": [
          {
            "kicker": "1",
            "title": "Ubica la interfaz",
            "text": "Cliente POS recibe la acción de agregar dos filtros."
          },
          {
            "kicker": "2",
            "title": "Ubica reglas y registro",
            "text": "Backend de sucursal valida; PostgreSQL conserva los datos confirmados."
          },
          {
            "kicker": "3",
            "title": "Ubica el trabajo posterior",
            "text": "Sincronizador y plataforma de país gestionan la entrega e integración."
          }
        ],
        "takeaway": "Sigue primero Cliente → Backend → PostgreSQL. Después estudia la salida hacia país.",
        "notes": [
          "La numeración es una guía de lectura pedagógica, no una secuencia completa ni un flujo de pago homologado. En C2 observamos responsabilidades y comunicaciones.",
          "Conservar el mismo ejemplo de compra ayuda a relacionar vistas: no cambiamos de sistema al pasar de C1 a C2, mostramos su interior.",
          "Preguntar qué parte se pierde al cerrar solo la interfaz y qué parte debe seguir viva. El backend y los datos de sucursal son independientes de esa ventana.",
          "El C2 no decide si hay Docker o cuántas máquinas habrá. Esa pregunta se trata en despliegue. El detalle de transacciones e integración aparece luego en los laboratorios."
        ],
        "source": {
          "label": "C4 oficial · Contenedores",
          "url": "https://c4model.com/diagrams/container"
        }
      },
      {
        "id": "contenedores-del-pos",
        "chapter": "arquitectura",
        "kind": "diagram",
        "diagramKey": "containers",
        "title": "C2 · Aplicaciones y datos con dueño",
        "lead": "Sigue Cliente → Backend → PostgreSQL de sucursal. Después localiza qué aplicaciones llevan la información a país.",
        "takeaway": "La interfaz pide; el backend aplica reglas; PostgreSQL conserva registros; la entrega posterior tiene responsables propios.",
        "notes": [
          "Angular + Tauri hospeda la interfaz y las capacidades nativas autorizadas. No recibe credenciales SQL ni se convierte en otro escritor de ventas.",
          "El backend de sucursal, recomendado como NestJS + Fastify, confirma negocio y outbox en PostgreSQL. El sincronizador tiene permisos acotados sobre datos técnicos y espejos.",
          "La API de país confirma inbox, efecto local o proyección y outbox en su propia transacción antes del ACK de aplicación. Los workers ejecutan después la integración externa.",
          "PostgreSQL local y de país tienen responsabilidades diferentes. No son dos autoridades concurrentes que puedan editar libremente la misma venta."
        ],
        "source": {
          "label": "Modelo C4 y contratos",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        id: 'lugares-de-ejecucion', chapter: 'arquitectura', kind: 'diagram', diagramKey: 'deployment',
        title: 'Puesto, sucursal y país',
        lead: 'El perfil inicial permite seguir con la sucursal disponible cuando falla Internet.',
        takeaway: 'Cerrar Tauri no debe detener el sincronizador supervisado de la sucursal.',
        notes: [
          'Los puestos acceden por LAN al backend y al escritor PostgreSQL autorizado de sucursal. El canal a país cruza la WAN y puede quedar pendiente.',
          'Si falla la LAN o el servidor de sucursal, este perfil no permite abrir automáticamente otra base por caja. La autonomía por terminal es un perfil adicional con otras reglas de propiedad y recuperación.',
          'Los SDK de impresora o pago pueden requerir un puente local homologado. Ese puente ejecuta la identidad e importe autorizados; no crea otro intento de cobro.',
          'No se fija en este mapa el proveedor cloud ni el dimensionamiento. Alta disponibilidad y backup necesitan decisiones y pruebas propias.'
        ], source: c4
      },
      {
        id: 'limites-de-continuidad', chapter: 'arquitectura', kind: 'compare',
        title: 'Sin WAN no es lo mismo que sin sucursal',
        lead: 'La capacidad de continuar depende del fallo y de las operaciones permitidas en ese perfil.',
        columns: [
          { title: 'Sin Internet', items: ['Backend y PostgreSQL local disponibles', 'Precios y permisos todavía válidos', 'Entrega a país queda pendiente'] },
          { title: 'Sin LAN o servidor', items: ['Se pierde acceso al escritor', 'Este perfil detiene nuevas ventas', 'Recuperar autoridad antes de reanudar'] },
          { title: 'Proveedor inaccesible', items: ['Pago solo si la modalidad lo permite', 'Fiscalidad según régimen aprobado', 'Informar restricción concreta al usuario'] }
        ],
        takeaway: 'Disponer de datos locales no autoriza cualquier pago, crédito o documento.',
        notes: [
          'Antes de operar se validan vigencias, permisos, disco, reloj, material fiscal y medios de pago. La autonomía efectiva está limitada por el menor de esos recursos.',
          'El horizonte de 72 horas de algunos documentos es una hipótesis de ensayo, no una licencia fiscal ni una garantía universal de tarjeta offline.',
          'Una sucursal sin red no puede garantizar exclusión global para consumir una NC o cupón compartido. Necesita conexión, derechos exclusivos previamente asignados o una restricción explícita.'
        ], source: proposal
      },
      {
        "id": "backend-modular",
        "chapter": "arquitectura",
        "kind": "diagram",
        "diagramKey": "backend",
        "title": "C3 · Un proceso, módulos explícitos",
        "lead": "Ampliamos solo el backend de sucursal. Sus componentes colaboran dentro del mismo proceso para atender la venta.",
        "takeaway": "Aquí “módulo” es una parte del código, no otro servidor. La persistencia conserva el resultado que se confirmó.",
        "notes": [
          "Acceso valida identidad, puesto, sucursal y capacidad real. Ocultar una opción en la UI no reemplaza la autorización del backend.",
          "Precios evalúa una versión local validada. Pagos y fiscalidad mantienen sus intentos, referencias y resultados. Caja posee turnos y movimientos.",
          "La unidad de trabajo confirma los cambios locales que deben ser atómicos junto con auditoría y outbox. No se mantiene la transacción SQL abierta esperando a un banco o al ERP.",
          "Extraer un microservicio requiere una necesidad comprobada de escala, aislamiento, seguridad o ciclo de entrega; no basta tener muchas carpetas."
        ],
        "source": {
          "label": "Modelo C4 y contratos",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "idempotencia-desde-cero",
        "chapter": "venta",
        "kind": "compare",
        "title": "Reintentar sin crear otra operación",
        "lead": "Si la respuesta se pierde, el emisor puede volver a enviar. El receptor debe reconocer de qué intento se trata.",
        "columns": [
          {
            "title": "Misma operación",
            "items": [
              "Identidad: venta V-42, evento E-42.",
              "Mismo contenido en cada reenvío.",
              "Se recupera el resultado acordado para ese intento."
            ]
          },
          {
            "title": "Nueva operación",
            "items": [
              "Un ID nuevo parece un intento diferente.",
              "Puede producir otro registro o efecto.",
              "Una corrección necesita relación y autorización explícitas."
            ]
          },
          {
            "title": "Idempotencia",
            "items": [
              "Repetir no repite el efecto definido.",
              "Necesita reconocimiento y protección durable.",
              "No se obtiene solo por usar una cola."
            ]
          }
        ],
        "takeaway": "La misma identidad con contenido distinto es un conflicto; no una actualización silenciosa.",
        "notes": [
          "La propiedad se define por frontera. Una inbox puede proteger el efecto local, pero no vuelve idempotente automáticamente un cobro o registro externo.",
          "Si el proveedor pudo aplicar el efecto y no devolvió respuesta, consultar o conciliar según su contrato antes de repetir.",
          "Pedir un contraejemplo: reintentar con una identidad nueva evita la deduplicación, por lo que no es la solución al timeout."
        ],
        "source": {
          "label": "Propuesta y límites de confirmación",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "pregunta-guardar-y-avisar",
        "chapter": "venta",
        "kind": "quiz",
        "title": "Primera comprobación: ¿qué sabemos?",
        "lead": "País guardó el evento y confirmó su transacción. La respuesta se perdió antes de llegar a la sucursal.",
        "question": "¿Qué puede concluir la sucursal cuando vence el tiempo de espera?",
        "options": [
          {
            "label": "País no guardó nada; debo generar otro evento.",
            "correct": false,
            "feedback": "La ausencia de respuesta no permite saber si hubo commit. Otro ID impediría reconocer que se trata del mismo hecho."
          },
          {
            "label": "No conozco el resultado; recupero con el mismo ID.",
            "correct": true,
            "feedback": "El receptor podrá reconocer el evento ya aplicado y devolver su resultado sin repetir el efecto local protegido."
          },
          {
            "label": "El ERP ya contabilizó la venta porque hubo un envío.",
            "correct": false,
            "feedback": "Enviar no demuestra recepción, y recibir en país no demuestra contabilización ERP. Son estados distintos."
          }
        ],
        "takeaway": "Timeout significa falta de respuesta concluyente; no significa rechazo ni éxito.",
        "notes": [
          "Pedir primero que separen tres hechos: el emisor envió, el receptor hizo commit y el emisor recibió el acuse. No son una sola acción.",
          "En este ejemplo el receptor protege su efecto local con identidad y transacción. Una API externa sin esas capacidades necesita una estrategia de consulta o conciliación distinta."
        ],
        "source": {
          "label": "Entrega y recuperación propuestas",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "laboratorio-venta",
        "chapter": "venta",
        "kind": "lab",
        "lab": "sale",
        "title": "Sigue una venta y sus puntos de fallo",
        "lead": "Caso de venta: CLP 11.400. Observa qué se preparó, qué se confirmó y qué puede seguir pendiente.",
        "takeaway": "La confirmación local necesita evidencia durable; la WAN no es el commit de la venta.",
        "notes": [
          "Recorrer primero el caso normal y después el fallo de WAN. El backend de sucursal y PostgreSQL siguen disponibles durante la simulación de desconexión.",
          "La intención de venta y de pago conserva una identidad estable antes de llamar a un proveedor. El pago se resuelve según el contrato real del medio usado.",
          "El commit final conserva venta, referencias de pago, movimientos, auditoría y outbox. La emisión fiscal depende de su régimen; no se supone una transacción distribuida con el proveedor.",
          "Un fallo de impresión permite reimprimir el mismo documento. No debe crear otra venta ni volver a cobrar."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        id: 'commit-y-outbox', chapter: 'venta', kind: 'code',
        title: 'La venta y su evento se guardan juntos',
        lead: 'La outbox es una tabla durable de cosas que debemos entregar. No es una llamada de red.',
        code: {
          language: 'typescript', label: 'Pseudocódigo · transacción local tras resolver el pago', highlights: '2-7',
          source: 'await db.transaction(async (tx) => {\n  await sales.confirm(tx, sale);\n  await cash.recordMovement(tx, movement);\n  await audit.record(tx, auditEntry);\n  await outbox.append(tx, {\n    eventId, type: "SaleConfirmed.v1", payload: sale\n  });\n});\n// El worker publica después del commit.\nreturn { saleId: sale.id, status: "confirmed" };'
        },
        takeaway: 'Caer antes de publicar deja una fila recuperable, no una venta olvidada en memoria.',
        notes: [
          'El fragmento es conceptual: no define una API real de ORM ni sustituye validaciones, restricciones únicas, control de concurrencia y recuperación del producto.',
          'La intención e identidad del pago deben existir antes de este punto. No se mete la llamada al adquirente dentro de la transacción SQL.',
          'Si la transacción falla, ninguno de estos efectos locales queda confirmado. Si el pago ya fue aprobado, se recupera desde su intención persistida y el contrato del proveedor.',
          'El ID del evento se mantiene en los reenvíos; no se genera un UUID nuevo cada vez que el worker intenta entregar.'
        ], source: proposal
      },
      {
        id: 'pago-desconocido', chapter: 'venta', kind: 'compare',
        title: 'Timeout: todavía no sabemos el resultado',
        lead: 'Un problema de red no permite concluir que el banco rechazó o que no cobró.',
        columns: [
          { title: 'Aprobado', items: ['Conservar referencia del proveedor', 'Completar el flujo autorizado', 'Recuperar si falla la escritura local'] },
          { title: 'Rechazado', items: ['Guardar causa y evidencia', 'Informar el rechazo confirmado', 'Otro intento exige decisión explícita'] },
          { title: 'Desconocido', items: ['Conservar identidad del intento', 'Consultar resultado o conciliar', 'No repetir el cargo a ciegas'] }
        ],
        takeaway: 'Desconocido es un estado de negocio que necesita un procedimiento de resolución.',
        notes: [
          'La consulta por referencia o repetición idempotente depende de capacidades demostradas del proveedor. El wrapper del POS no puede inventar esas garantías.',
          'Si el pago fue aprobado y no puede completarse la venta, procede reversa o intervención operativa trazable según contrato. No se descarta la evidencia.',
          'Una aceptación offline del adquirente conserva su estado específico y riesgo. No se presenta automáticamente como pago liquidado.'
        ], source: extensions
      },
      {
        id: 'autoridades-del-dinero', chapter: 'venta', kind: 'cards',
        title: 'Cuatro resultados, cuatro evidencias',
        lead: 'Una sola etiqueta “completado” ocultaría qué falta resolver.',
        items: [
          { title: 'Venta', text: 'El POS de origen conserva la operación confirmada y sus correcciones.' },
          { title: 'Pago', text: 'El proveedor acredita autorización y liquidación; el POS guarda referencias.' },
          { title: 'Documento fiscal', text: 'El emisor y el régimen determinan validez, aceptación y contingencia.' },
          { title: 'Contabilidad', text: 'El sistema financiero confirma registro o contabilización en su propio ciclo.' }
        ],
        takeaway: 'Un rechazo ERP no borra una venta realizada ni autoriza a cobrarla otra vez.',
        notes: [
          'Usar identificadores separados para venta, intento de pago, documento fiscal y operación ERP. Se relacionan, pero tienen ciclos de vida diferentes.',
          'El supervisor necesita conocer causa, alcance, responsable y acción segura. Evitar un botón genérico de reintentar que repita cualquier efecto.',
          'Las correcciones son anulaciones, devoluciones o ajustes trazables. No se reescribe silenciosamente la historia financiera.'
        ], source: proposal
      },
      {
        "id": "paquete-de-precios-desde-cero",
        "chapter": "precios",
        "kind": "cards",
        "title": "Un precio necesita su contexto",
        "lead": "Tener una lista de importes no basta para decidir cuánto pagar por una cesta.",
        "items": [
          {
            "title": "Datos",
            "text": "Producto, precio base, moneda, grupos y promociones relacionadas. La fuente responsable los publica como un conjunto conocido, con el ámbito al que pertenecen."
          },
          {
            "title": "Reglas",
            "text": "Cantidad, cliente, vendedor, fechas y combinaciones permitidas pueden cambiar el resultado. El motor local aplica reglas compatibles con ese conjunto de datos."
          },
          {
            "title": "Versión",
            "text": "Una etiqueta identifica el conjunto aprobado: por ejemplo, catálogo A. La venta guarda qué versión utilizó para poder explicar después su importe."
          },
          {
            "title": "Vigencia",
            "text": "La autorización para usar ese conjunto tiene límites. Caer Internet no los amplía. Si faltan datos requeridos o vencen, se restringe el cálculo afectado."
          }
        ],
        "takeaway": "El espejo local conserva una copia autorizada; la sucursal no se vuelve dueña de las reglas comerciales.",
        "notes": [
          "Usar la analogía de una receta: ingredientes correctos con instrucciones incompatibles no producen el resultado aprobado. La analogía explica que datos y motor necesitan compatibilidad.",
          "Precio, promoción y cálculo son capacidades distintas. El paquete distribuye datos y reglas compatibles; la evaluación utiliza el contexto de la operación.",
          "El ejemplo es sintético. La paridad con el motor real y la autoridad de cada dato siguen pendientes de validación por país."
        ],
        "source": {
          "label": "Modelo propuesto de precios",
          "url": "../docs/operacion-caja-y-evolucion.md"
        }
      },
      {
        "id": "snapshot-y-delta-desde-cero",
        "chapter": "precios",
        "kind": "compare",
        "title": "Dos maneras de llevar cambios a tienda",
        "lead": "Una carga completa y una incremental resuelven necesidades diferentes. Ambas terminan validando una versión completa.",
        "columns": [
          {
            "title": "Snapshot: una foto completa",
            "items": [
              "Todo el conjunto de un ámbito en un corte conocido.",
              "Sirve para iniciar o reparar la copia local.",
              "Debe reflejar también lo eliminado hasta ese corte."
            ]
          },
          {
            "title": "Delta: cambios desde una base",
            "items": [
              "Altas, modificaciones y bajas posteriores.",
              "Requiere saber sobre qué versión se aplica.",
              "Un cambio ausente puede impedir reconstruir el conjunto."
            ]
          },
          {
            "title": "Ejemplo pequeño",
            "items": [
              "Foto A: productos, precios y ofertas.",
              "Cambio B: una oferta pasa a estar deshabilitada.",
              "La copia B conserva todo A y aplica esa baja."
            ]
          }
        ],
        "takeaway": "Un delta reduce lo transportado; no autoriza a mostrar una versión parcialmente actualizada.",
        "notes": [
          "Una foto completa puede descargarse en varios archivos. Completa describe su cobertura lógica, no que sea un único archivo o una única petición.",
          "Un delta es un cambio, no una herramienta. Puede llegar mediante un evento o un lote HTTP; el protocolo debe conservar identidad, base y orden cuando sean necesarios.",
          "B representa una versión didáctica, no un número de secuencia real. Una versión comercial y un cursor de transporte no son el mismo concepto."
        ],
        "source": {
          "label": "Carga completa e incremental de precios",
          "url": "../docs/operacion-caja-y-evolucion.md"
        }
      },
      {
        "id": "preparar-y-activar-desde-cero",
        "chapter": "precios",
        "kind": "cards",
        "title": "Preparar detrás; publicar cuando esté listo",
        "lead": "La venta sigue leyendo A mientras se construye B. Estos nombres explican cómo evitar un catálogo a medias.",
        "items": [
          {
            "kicker": "1 · Watermark",
            "title": "Hasta aquí contiene la foto",
            "text": "El corte H indica hasta dónde contiene datos la foto. Los cambios posteriores deben recuperarse."
          },
          {
            "kicker": "2 · Staging",
            "title": "La mesa de preparación",
            "text": "Un área aislada construye B. Las ventas siguen leyendo A mientras B está incompleta."
          },
          {
            "kicker": "3 · Validación",
            "title": "Comprobar el conjunto",
            "text": "Comprobar cobertura, referencias, compatibilidad y vigencia. El checksum solo verifica bytes; no valida reglas comerciales."
          },
          {
            "kicker": "4 · Activación",
            "title": "Cambiar la versión de lectura",
            "text": "Un commit publica B y su progreso juntos. Una venta abierta revalida su cotización al confirmar."
          }
        ],
        "takeaway": "Recibido significa descargado. Activo significa validado y publicado para su uso autorizado.",
        "notes": [
          "La analogía de la mesa de preparación no implica una segunda base obligatoria. Staging puede ser almacenamiento separado dentro de la misma sucursal.",
          "El avance recibido permite reanudar la descarga. El avance aplicado declara qué quedó publicado; no se debe adelantar por haber recibido un archivo.",
          "La activación comprueba que la base esperada siga vigente y no retrocede una versión ya aplicada. La descarga y validación pesada no mantienen abierta la transacción final.",
          "Esta lámina prepara los términos visibles en ambos laboratorios de precios. Los fallos posteriores enseñan el detalle del protocolo, no una idea nueva de publicación.",
          "Hasta aquí contiene la foto: El origen declara un corte consistente H. La foto incluye todos los cambios de su ámbito hasta H. Los posteriores deben recuperarse; una hora del PC no demuestra ese corte.",
          "La mesa de preparación: Un área aislada recibe archivos y guarda el avance. Allí se construye B, la candidata. Las ventas todavía no leen esa copia mientras faltan partes o comprobaciones.",
          "Comprobar el conjunto: Completar cambios posteriores a H y verificar cobertura, referencias, compatibilidad y vigencia. El checksum compara bytes con una huella esperada; por sí solo no valida las reglas comerciales.",
          "Cambiar la versión de lectura: Un commit corto publica B y su progreso aplicado juntos. Una venta nueva lee B; una abierta conserva su versión y revalida la cotización al confirmar."
        ],
        "source": {
          "label": "Validación y activación de versiones",
          "url": "../docs/c4-arquitectura-propuesta.md"
        }
      },
      {
        "id": "pregunta-hueco-de-precios",
        "chapter": "precios",
        "kind": "quiz",
        "title": "Antes de animarlo: falta un cambio",
        "lead": "La tienda conserva A. Recibe C, pero C necesita los cambios de B y B no llegó.",
        "question": "¿Qué hacemos con C mientras recuperamos B?",
        "options": [
          {
            "label": "Publicarlo porque su nombre parece más nuevo.",
            "correct": false,
            "feedback": "Un nombre mayor no demuestra cobertura. Aplicar C sin su base puede dejar precios y ofertas que nunca fueron validados juntos."
          },
          {
            "label": "Guardarlo en preparación y mantener A bajo su política.",
            "correct": true,
            "feedback": "Recuperamos la base o pedimos una foto completa nueva. A solo se usa mientras continúe autorizada; no recibe vigencia extra por el fallo."
          },
          {
            "label": "Mezclar lo recibido con las filas activas.",
            "correct": false,
            "feedback": "Las ventas podrían leer medio cambio. La candidata debe completarse y validarse antes de activar el conjunto."
          }
        ],
        "takeaway": "Esperar una base necesaria protege la coherencia; no convierte una versión vencida en utilizable.",
        "notes": [
          "Pedir que expliquen con las palabras recién aprendidas: C está recibida en staging, pero todavía no activa; A sigue activa solo dentro de su autorización.",
          "Si el origen ya no conserva B, pedir una nueva carga consistente. No suponer que siempre existe un historial infinito."
        ],
        "source": {
          "label": "Huecos y recuperación de precios",
          "url": "../docs/operacion-caja-y-evolucion.md"
        }
      },
      {
        id: 'espejo-de-precios', chapter: 'precios', kind: 'cards',
        title: 'Precio offline no es cachear un importe',
        lead: 'La sucursal necesita un conjunto coherente de datos y reglas para explicar cómo calculó el ticket.',
        items: [
          { title: 'Datos autorizados', text: 'Productos, listas, grupos y condiciones necesarias para las operaciones habilitadas.' },
          { title: 'Reglas de ofertas', text: 'Prioridades, acumulación, cantidades, vigencias y redondeos definidos.' },
          { title: 'Versión y procedencia', text: 'Manifiesto publicado, ámbito, compatibilidad y punto de continuidad del origen.' },
          { title: 'Evidencia del cálculo', text: 'Precio, descuento, reglas y versión que quedaron asociados a la venta.' }
        ],
        takeaway: 'La sucursal evalúa una versión aprobada; no se convierte en autora independiente de precios.',
        notes: [
          'El inventario de precios actuales debe identificar los datos y comportamientos del servicio remoto: grupos, descuentos, históricos, mínimos, vigencias y redondeos.',
          'Extraer el motor requiere casos de referencia. Comparar solo el total es insuficiente: dos reglas equivocadas pueden producir accidentalmente el mismo importe.',
          'La creación local de campañas requiere un alcance y autorización propios. Una caída de Internet no concede permiso para publicar ofertas globales.',
          'Cupones de uso único y presupuestos compartidos no se vuelven seguros por copiar sus datos; necesitan exclusión o restricciones aprobadas.'
        ], source: proposal
      },
      {
        id: 'contrato-del-calculo', chapter: 'precios', kind: 'code',
        title: 'Un cálculo reproducible y explicable',
        lead: 'La misma entrada y versión deben producir el mismo resultado en nodos homologados.',
        code: {
          language: 'typescript', label: 'Contrato educativo · motor puro de precios', highlights: '1-6|7-10',
          source: 'const quote = pricing.quote({\n  cart: [{ sku: "SKU-01", quantity: 2 }],\n  customerGroup: "general",\n  pricingVersion: "CL-2026-42",\n  businessTime: approvedBusinessTime\n});\n// Ejemplo: 2 × $10.000, descuento 10 % → $18.000\nquote.total;        // { amountMinor: "18000", currency: "CLP" }\nquote.appliedRules; // ["PROMO-10"]\nquote.pricingVersion; // "CL-2026-42"'
        },
        takeaway: 'Persistir el importe y por qué resultó ese importe.',
        notes: [
          'El ejemplo usa importes ficticios y omite el detalle tributario para enseñar el contrato. La escala, impuestos y redondeos de cada moneda y régimen deben estar definidos en el producto.',
          'amountMinor es una representación conceptual serializable, no una licencia para hacer dinero con floats. Se necesita un tipo Money y operaciones decimales o enteras adecuadas.',
          'El tiempo de negocio debe cumplir la política de reloj aprobada. Un reloj local que retrocede no puede extender silenciosamente la vigencia de una promoción.',
          'La pureza del cálculo separa reglas de Angular, NestJS, SQL y servicios remotos; eso permite ejecutar casos de referencia y pruebas de compatibilidad.'
        ], source: proposal
      },
      {
        id: 'version-fijada', chapter: 'precios', kind: 'compare',
        title: 'Una actualización no cambia el ticket debajo del cajero',
        lead: 'Cada cotización fija la versión que utiliza. La activación prepara el precio de operaciones nuevas.',
        columns: [
          { title: 'Venta en curso', items: ['Conserva la versión utilizada', 'Guarda reglas y descuentos aplicados', 'Revalidación según política de vigencia'] },
          { title: 'Nueva versión', items: ['Se construye de forma aislada', 'Se publica completa tras validar', 'Se usa en nuevas cotizaciones válidas'] },
          { title: 'Historia', items: ['No recalcular ventas antiguas', 'Retener versiones referenciadas', 'Correcciones con trazabilidad'] }
        ],
        takeaway: 'Versión fijada aporta consistencia; la política determina hasta cuándo puede aceptarse la cotización.',
        notes: [
          'No prometer que una cotización conserva vigencia eternamente. Si la oferta vence antes del cobro, el negocio debe definir recotización o aceptación dentro de límites autorizados.',
          'La descarga de B nunca reescribe filas de A mientras A está siendo utilizada. Los datos publicados son inmutables; lo que cambia atómicamente es el puntero de versión.',
          'La retención debe preservar versiones necesarias para ventas en curso, auditoría y recuperación. Un recolector no puede borrar lo que sigue referenciado.'
        ], source: c4
      },
      {
        id: 'laboratorio-eventos-precios', chapter: 'precios', kind: 'lab', lab: 'prices-events',
        title: 'Eventos: recibir cambios sin mezclar versiones',
        lead: 'Un duplicado se reconoce. Un hueco impide publicar un conjunto incompleto.',
        takeaway: 'Los deltas también construyen una candidata; nunca parchean la versión activa.',
        notes: [
          'El origen debe publicar un contrato de identidad, orden y cobertura. No se presupone que los sistemas actuales ya generen todos los eventos necesarios.',
          'Mostrar primero entrega ordenada, luego un duplicado y después un hueco. Guardar la recepción permite recuperar sin declarar que ese cambio ya está aplicado.',
          'Una candidata se basa en la versión publicada y aplica deltas compatibles. La validación considera el conjunto resultante antes de activar.',
          'El mismo ID con payload distinto es un conflicto trazable, no un duplicado válido. Los errores de un ámbito deben aislarse sin bloquear todas las sucursales.'
        ], source: c4
      },
      {
        id: 'laboratorio-snapshot-precios', chapter: 'precios', kind: 'lab', lab: 'prices-snapshot',
        title: 'Carga masiva: fotografía y continuidad',
        lead: 'El snapshot parte de un watermark consistente del origen. Los deltas posteriores completan la candidata.',
        takeaway: 'Durante la descarga, la versión activa sigue atendiendo sin exponer datos parciales.',
        notes: [
          'Watermark significa punto consistente de continuidad publicado por el origen; no es simplemente la hora a la que el navegador comenzó la descarga.',
          'El manifiesto describe versión, ámbito y partes esperadas. Se descargan porciones a staging con progreso durable y posibilidad de reanudar.',
          'Las modificaciones posteriores al watermark se incorporan según el contrato del origen. Si faltan cambios, cobertura o compatibilidad, no se publica.',
          'La descarga y validación pesada ocurren fuera de la transacción final. Mantener una transacción abierta mientras baja una red lenta dañaría disponibilidad y recuperación.',
          'Carga nocturna, recuperación y ejecución manual deben pasar por este mismo pipeline de publicación.'
        ], source: c4
      },
      {
        id: 'activacion-atomica', chapter: 'precios', kind: 'code',
        title: 'Publicar es un commit corto',
        lead: 'La candidata ya está completa y validada. Dentro del commit se revalidan las precondiciones y se cambia la versión.',
        code: {
          language: 'typescript', label: 'Pseudocódigo · publicación con precondiciones', highlights: '1|2-8',
          source: 'const candidate = await prepareAndValidate(manifest);\nawait db.transaction(async (tx) => {\n  await versions.assertPublishable(tx, candidate);\n  await versions.activateIfCurrent(tx, {\n    expected: candidate.baseVersion, next: candidate.id\n  });\n  await inbox.markApplied(tx, candidate.eventIds);\n  await cursors.advanceApplied(tx, candidate.checkpoint);\n});'
        },
        takeaway: 'Versión activa, inbox aplicada y cursor aplicado cambian juntos o no cambian.',
        notes: [
          'El código expresa un contrato, no una implementación lista para producción. activateIfCurrent debe aplicar comparación atómica y fallar si otro publicador cambió la base esperada.',
          'assertPublishable revalida identidad, estado inmutable, ámbito, compatibilidad y vigencia; no vuelve a descargar ni recalcula todo dentro de SQL.',
          'La evidencia de validación incluye checksum, cobertura y referencias. Un hash correcto solo prueba igualdad de bytes frente al manifiesto confiable, no validez de todas las reglas.',
          'Si aparece un cambio concurrente, se reconstruye o revalida la candidata conforme al protocolo. No se publica a la fuerza ni se adelanta el checkpoint.'
        ], source: c4
      },
      {
        id: 'recibido-versus-aplicado', chapter: 'precios', kind: 'compare',
        title: 'Descargado, validado y aplicado son estados distintos',
        lead: 'La versión identifica un conjunto; watermark y cursores ubican cambios; el checksum es una huella de los bytes.',
        columns: [
          { title: 'Recibido', items: ['Inbox y porciones guardadas', 'Cursor de recepción durable', 'Puede faltar cobertura o validación'] },
          { title: 'Validado', items: ['Candidata completa y compatible', 'Checksum, referencias y vigencia', 'Todavía no es la versión activa'] },
          { title: 'Aplicado', items: ['Puntero publicado por commit', 'Inbox aplicada y checkpoint juntos', 'Nueva lectura usa versión coherente'] }
        ],
        takeaway: 'Versión ≠ posición del flujo ≠ checksum. Descargar el 100 % todavía no demuestra una publicación válida.',
        notes: [
          'La UI debe mostrar versión activa, versión recibida, resultado de validación y última aplicación. Eso permite distinguir atraso normal, incompatibilidad y fallo.',
          'El cursor recibido permite retomar la transferencia. El aplicado se mueve únicamente después de que el efecto requerido esté confirmado de forma atómica.',
          'El ID de versión identifica un conjunto publicado y puede ser opaco. El watermark declara el corte consistente del snapshot; los cursores describen progreso de recepción o aplicación dentro del ámbito y contrato del flujo.',
          'El checksum es una huella del contenido: comparar contra el manifiesto confiable permite detectar cambios en los bytes. No demuestra por sí solo cobertura, validez comercial, procedencia autorizada ni vigencia.',
          'Los laboratorios usan nombres como v102 y checkpoint 102 para seguir un ejemplo pequeño. La coincidencia numérica es didáctica: no se deriva la versión del cursor ni se ordenan versiones comparando sus IDs como texto.',
          'El canal incremental y el masivo conservan la misma semántica. No se implementa un atajo especial para el botón manual.'
        ], source: c4
      },
      {
        id: 'fallos-de-precios', chapter: 'precios', kind: 'cards',
        title: 'Qué debe pasar cuando algo falla',
        lead: 'Las reglas de recuperación son parte del diseño del precio, no un agregado después del piloto.',
        items: [
          { title: 'Descarga incompleta', text: 'Guardar progreso y reanudar. La versión activa permanece íntegra.' },
          { title: 'Evento faltante', text: 'Detener publicación del ámbito y recuperar cobertura; no saltar el hueco.' },
          { title: 'Promoción vencida', text: 'Aplicar política local aprobada; no extender la vigencia por falta de red.' },
          { title: 'Reloj o disco inválidos', text: 'Restringir la operación afectada y preservar evidencia y espacio de recuperación.' }
        ],
        takeaway: 'Mantener la versión previa evita mezclar datos; no convierte una regla vencida en válida.',
        notes: [
          'El comportamiento ante una promoción vencida puede incluir recalcular sin esa oferta o restringir la venta, según el contrato aprobado. No inventar siempre el mismo fallback.',
          'Los descuentos locales, presupuestos compartidos y cupones únicos requieren políticas particulares. No se deduce autorización de disponer de la ficha del cliente.',
          'Las pruebas deben cortar procesos antes y después de recibir, validar y activar. Conservar registros e IDs para demostrar qué versión quedó publicada.'
        ], source: resilience
      },
      {
        id: 'ejecucion-manual-programada', chapter: 'precios', kind: 'cards',
        title: 'Programar o ejecutar ahora: el mismo proceso',
        lead: 'El disparador cambia. Las garantías, permisos y límites permanecen.',
        items: [
          { title: 'Calendario', text: 'Zona horaria, ventana, frecuencia y política de fechas especiales explícitas.' },
          { title: 'Ejecución manual', text: 'Ámbito, motivo, permiso y resultado quedan auditados.' },
          { title: 'Exclusión', text: 'Un claim o lease verificable evita publicaciones simultáneas del mismo ámbito.' },
          { title: 'Recuperación', text: 'Checkpoint, límite de caudal y reanudación segura tras caída o mantenimiento.' }
        ],
        takeaway: 'El botón “Ejecutar” no puede saltarse validaciones ni una ventana operativa cerrada.',
        notes: [
          'Programado no significa ejecutado en ese instante: la carga, concurrencia y disponibilidad pueden retrasar el inicio. Mostrar próxima admisión y ejecución real por separado.',
          'La zona horaria de la política debe estar definida; un offset fijo no maneja por sí solo cambios de horario ni horas repetidas.',
          'El worker que pierde su lease no puede confirmar trabajo que ya pertenece a otro. Usar escrituras condicionales y fencing cuando corresponda.',
          'Si la política permite una excepción manual a una ventana, necesita permiso y evidencia explícitos. La presentación no concede ese permiso por defecto.'
        ], source: resilience
      },
      {
        id: 'pregunta-precios', chapter: 'precios', kind: 'quiz',
        title: 'Comprueba el diseño de precios',
        lead: 'Llegó el último archivo de la versión B, pero falla una referencia de promoción.',
        question: '¿Qué debería quedar activo?',
        options: [
          { label: 'B, porque terminó la descarga.', correct: false, feedback: 'Descargar todos los archivos no acredita integridad semántica. Falta una candidata válida.' },
          { label: 'A íntegra, aplicando sus límites de vigencia y operación.', correct: true, feedback: 'B no se publica. A sigue íntegra, pero sus reglas no pueden usarse fuera de los límites aprobados.' },
          { label: 'Los precios de A y las promociones válidas de B.', correct: false, feedback: 'Mezclar conjuntos expone una versión que nunca se validó como unidad y rompe la trazabilidad.' }
        ],
        takeaway: 'La unidad de publicación es un conjunto coherente, no cada archivo o fila por separado.',
        notes: [
          'Pedir al equipo que identifique qué estado persiste: B recibida con fallo de validación, A aplicada y cursor aplicado sin avanzar.',
          'Si A vence, debe entrar la política de restricción o recalculación aprobada. La respuesta no supone disponibilidad ilimitada.',
          'La recuperación puede completar o reconstruir B, siempre preservando el manifiesto, las identidades y la evidencia del fallo.'
        ], source: c4
      },
      {
        id: 'sincronizador-por-dentro', chapter: 'sincronizacion', kind: 'diagram', diagramKey: 'sync',
        title: 'C3 · El sincronizador conserva el progreso',
        lead: 'Un proceso supervisado entrega operaciones, recupera entradas y publica versiones locales validadas.',
        takeaway: 'Sincronizar incluye reanudar y demostrar resultados; no solo copiar datos.',
        notes: [
          'La salida reclama filas ya confirmadas de outbox y las entrega con identidad estable. La entrada conserva recepción, staging y cursor antes de declarar aplicación.',
          'El planificador aplica calendario, capacidad y límites. Los estados se recuperan al reiniciar: arrancar el proceso no implica volver automáticamente a Running si estaba en mantenimiento.',
          'El worker tiene permisos sobre datos técnicos y espejos. Una actualización que afecte dinero debe pasar por el caso de uso y autoridad del módulo, nunca por un job genérico de SQL.',
          'Para precios, todos los caminos hacia activación pasan por una candidata completa y validación. No dibujar una flecha de deduplicación a versión activa que salte esa frontera.'
        ], source: c4
      },
      {
        id: 'laboratorio-entrega', chapter: 'sincronizacion', kind: 'lab', lab: 'delivery',
        title: 'El ACK se perdió. El efecto ya ocurrió.',
        lead: 'Reenviar es normal. El receptor debe reconocer la misma operación y preservar el resultado.',
        takeaway: 'Entrega al menos una vez + efectos idempotentes; sin prometer exactly-once global.',
        notes: [
          'La API de país confirma inbox, efecto local o proyección y outbox juntos antes de responder. No basta registrar solo que recibió el mensaje.',
          'Si el ACK se pierde después de ese commit, el origen reenvía con el mismo eventId. La restricción única y el contrato de payload permiten reconocer el duplicado.',
          'Un ID reutilizado con contenido distinto debe producir conflicto y alerta. La identidad se verifica dentro del ámbito del dispositivo y entidad autenticados.',
          'La deduplicación necesita retención compatible con replay y restauración. Un backup anterior al ACK puede retroceder ese recuerdo; hace falta un procedimiento de reconstrucción y conciliación.'
        ], source: proposal
      },
      {
        id: 'significado-de-acuses', chapter: 'sincronizacion', kind: 'cards',
        title: '¿Qué está confirmando este acuse?',
        lead: 'El punto que responde determina la garantía. No se puede extender a toda la cadena.',
        items: [
          { title: 'Commit local', text: 'El escritor confirmó el cambio dentro de su frontera transaccional.' },
          { title: 'ACK de aplicación', text: 'El receptor confirmó el efecto local requerido y su evidencia durable.' },
          { title: 'Resultado externo', text: 'El ERP o proveedor acreditó el estado de esa operación.' },
          { title: 'Conciliación', text: 'Conteos, importes y referencias coinciden para el ámbito revisado.' }
        ],
        takeaway: 'Recibido por país no significa contabilizado, aceptado fiscalmente ni liquidado.',
        notes: [
          'En RabbitMQ se suman publisher confirms y consumer acknowledgements. Son confirmaciones del broker y del consumidor, con otra responsabilidad específica.',
          'La UI debe nombrar el destino y la etapa: recepción central pendiente, ERP rechazado o pago desconocido. “Sincronizado” sin más contexto resulta ambiguo.',
          'Conservar pendientes hasta el acuse acordado y luego aplicar retención de recuperación. Un ACK no implica borrar de inmediato toda evidencia del origen.'
        ], source: messaging
      },
      {
        id: 'elegir-mensajeria', chapter: 'sincronizacion', kind: 'compare',
        title: 'Elegir la herramienta por responsabilidad',
        lead: 'La base recomendada comienza con PostgreSQL, HTTPS durable y workers. Las extensiones necesitan una razón comprobable.',
        columns: [
          { title: 'Base propuesta', items: ['Outbox e inbox transaccionales', 'Lotes HTTPS con cursores e identidades', 'Workers y resultados durables'] },
          { title: 'BullMQ', items: ['Coordinar jobs de una aplicación', 'Programación y reintentos delimitados', 'Backend y operación explícitos'] },
          { title: 'RabbitMQ', items: ['Distribuir mensajes entre consumidores', 'Enrutamiento y aislamiento de cargas', 'Custodia y recuperación del broker'] }
        ],
        takeaway: 'Ninguna cola reemplaza reglas de negocio, traducción ERP o idempotencia del efecto.',
        notes: [
          'No se instalan Redis o RabbitMQ por defecto en cada sucursal. La outbox local permite entregar al volver la conectividad.',
          'Si la organización ya opera un servicio gestionado que satisface el caso, debe compararse su reutilización con introducir otro broker. No añadir varios productos para el mismo trabajo sin responsabilidad distinta.',
          'WSO2 puede incluir mediación, protocolos, transformaciones y persistencia. Reemplazar su broker no migra automáticamente esas responsabilidades.',
          'BullMQ se ilustra con Redis en el laboratorio; su documentación también contempla PostgreSQL. La versión y madurez del backend elegido requieren validación, no se adopta por aparecer en una diapositiva.'
        ], source: messaging
      },
      {
        id: 'laboratorio-bullmq', chapter: 'sincronizacion', kind: 'lab', lab: 'bullmq',
        title: 'BullMQ · Cuándo ejecutar un trabajo',
        lead: 'Programa o lanza una tarea recuperable y observa ejecución, backoff y resultado durable.',
        takeaway: 'El ID del job ayuda a coordinar la cola; no sustituye la identidad del efecto de negocio.',
        notes: [
          'Este laboratorio representa una opción central con BullMQ y Redis. No supone una dependencia Redis en cada caja ni incorpora la cola al commit SQL de una venta.',
          'Los disparadores programado y manual llaman a la misma capacidad autorizada. El worker limita concurrencia, registra progreso y valida precondiciones antes de publicar.',
          'Reintentar un fallo técnico recuperable puede ser correcto. Un rechazo funcional se trata como tal; un efecto remoto desconocido exige consulta o conciliación.',
          'Job Schedulers y jobId son mecanismos de coordinación; no acreditan puntualidad ni idempotencia financiera permanente. La evidencia durable debe permitir recuperar trabajo incluso si se pierde el estado de la cola.',
          'En Redis se deben decidir persistencia, capacidad, noeviction, copias y acceso. Los payloads de jobs no deben contener datos de tarjeta o secretos.'
        ], source: messaging
      },
      {
        id: 'laboratorio-rabbitmq', chapter: 'sincronizacion', kind: 'lab', lab: 'rabbitmq',
        title: 'RabbitMQ · A quién entregar un evento',
        lead: 'Dos consumidores lógicos reciben copias mediante colas distintas. Cada uno protege su propio efecto.',
        takeaway: 'Confirm del broker y ACK del consumidor confirman fronteras diferentes.',
        notes: [
          'En el ejemplo, integración ERP y reporting son consumidores independientes y usan colas diferentes. Dos workers de una misma cola compiten por los mensajes, no reciben ambos cada uno.',
          'Publisher confirm indica la responsabilidad asumida por el broker según su configuración. No prueba que el ERP haya registrado nada.',
          'El consumidor confirma su ACK después del commit local requerido. Si cae antes del ACK, la entrega puede repetirse y debe ser idempotente.',
          'Un mensaje sin ruta puede recibir confirm. La publicación debe gestionar mandatory/returns y topología, además del confirm.',
          'Los reintentos se limitan y los errores necesitan cuarentena con dueño y recuperación. No requeue infinito ni TTL que descarte una obligación monetaria sin resolución auditable.'
        ], source: messaging
      },
      {
        "id": "patron-y-acoplamiento-desde-cero",
        "chapter": "integracion",
        "kind": "compare",
        "title": "Un patrón empieza por un problema",
        "lead": "Un patrón es una solución conocida para una situación repetida. Debe aclarar responsabilidades y costes, no sumar nombres al código.",
        "columns": [
          {
            "title": "Problema: acoplamiento",
            "items": [
              "Ventas conoce códigos y campos del proveedor.",
              "Cambiar ese proveedor obliga a modificar varias pantallas.",
              "Probar una regla exige conectar el sistema externo."
            ]
          },
          {
            "title": "Límite que buscamos",
            "items": [
              "Ventas expresa lo que necesita en lenguaje POS.",
              "Una frontera traduce y llama al proveedor.",
              "Las pruebas sustituyen esa implementación externa."
            ]
          },
          {
            "title": "Coste que aceptamos",
            "items": [
              "Hay contratos y traducciones que mantener.",
              "Las equivalencias necesitan pruebas.",
              "Una frontera inútil solo añade indireccionamiento."
            ]
          }
        ],
        "takeaway": "Menos acoplamiento significa que un cambio externo obliga a cambiar menos partes del POS.",
        "notes": [
          "Ejemplo: si cinco pantallas interpretan el estado 7 de un proveedor, todas conocen su significado. Centralizar esa traducción reduce los puntos afectados por un cambio.",
          "No existe independencia absoluta: el producto necesita capacidades reales del destino. El contrato hace visible esa dependencia y evita repartir sus detalles.",
          "Un patrón no es una librería que se instala ni garantiza calidad por su nombre. Debe resolver una necesidad concreta y demostrar su utilidad con pruebas."
        ],
        "source": {
          "label": "Fronteras y extensibilidad del POS",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      },
      {
        "id": "puerto-interfaz-adaptador-desde-cero",
        "chapter": "integracion",
        "kind": "cards",
        "title": "Pedir una capacidad sin conocer su proveedor",
        "lead": "Puerto, interfaz y adaptador se relacionan, pero cada palabra responde una pregunta distinta.",
        "items": [
          {
            "title": "Puerto",
            "text": "Define la capacidad que el POS necesita: registrar una venta y consultar su resultado. No es un puerto de red."
          },
          {
            "title": "Interfaz",
            "text": "Declara operaciones, entradas y resultados en código. No contiene la llamada HTTP ni prueba el comportamiento."
          },
          {
            "title": "Adaptador",
            "text": "Implementa la llamada al protocolo o SDK del destino. Podemos sustituirlo por otra implementación compatible."
          },
          {
            "title": "Dependencias",
            "text": "El caso de uso conoce el contrato POS; el adaptador lo implementa. El proveedor queda fuera del caso de uso."
          }
        ],
        "takeaway": "Caso de uso → contrato POS ← adaptador concreto. Las flechas expresan dependencias de código, no viajes del mensaje.",
        "notes": [
          "Distinguir ejecución de dependencia: al ejecutar se llamará al adaptador seleccionado, pero el código del caso de uso se escribe contra el contrato estable.",
          "La composición de la aplicación decide qué implementación suministrar. El modelo de negocio no selecciona un SDK por nombre dentro de cada operación.",
          "Sustituir un adaptador exige compatibilidad de contrato y pruebas. No significa que cualquier proveedor implemente todas las capacidades necesarias.",
          "Puerto: ¿qué necesito?: El POS necesita «registrar una venta en el sistema financiero» y consultar su resultado. El puerto define esa conversación desde las necesidades del POS; aquí no significa puerto de red.",
          "Interfaz: ¿cómo lo expresamos?: Una interface de TypeScript declara operaciones, entradas y resultados. Puede expresar el puerto en código. No contiene la llamada HTTP ni demuestra por sí sola el comportamiento acordado.",
          "Adaptador: ¿cómo lo cumplo?: Una implementación concreta traduce llamadas al protocolo o SDK del destino. Otra implementación puede servir para un proveedor distinto o para una prueba local controlada.",
          "Dependencia: ¿quién conoce a quién?: El caso de uso conoce el contrato POS. El adaptador también conoce ese contrato y lo implementa. El código del caso de uso no importa la clase del proveedor concreto."
        ],
        "source": {
          "label": "Puertos y adaptadores · Alistair Cockburn",
          "url": "https://alistair.cockburn.us/hexagonal-architecture"
        }
      },
      {
        "id": "fachada-paso-a-paso",
        "chapter": "integracion",
        "kind": "cards",
        "title": "Fachada (Facade): una entrada clara",
        "lead": "La fachada evita que cada consumidor conozca la coordinación interna de la integración.",
        "items": [
          {
            "kicker": "1",
            "title": "El consumidor pide",
            "text": "Un worker llama integrarVenta(operación). Entrega identidad, importe, contexto y destino ya asignado. No construye el mensaje específico de cada proveedor."
          },
          {
            "kicker": "2",
            "title": "La fachada coordina",
            "text": "Ofrece la capacidad estable y delega en el flujo responsable. No obliga al consumidor a conocer qué traductor, consulta o adaptador participa por dentro."
          },
          {
            "kicker": "3",
            "title": "La frontera trabaja",
            "text": "La traducción adapta significados y el adaptador ejecuta el protocolo. El flujo conserva intención, evidencia y recuperación según el contrato de la operación."
          },
          {
            "kicker": "4",
            "title": "El consumidor recibe",
            "text": "El resultado vuelve en lenguaje POS: recibido, registrado, rechazado o desconocido, según la evidencia real. El consumidor no interpreta códigos internos del proveedor."
          }
        ],
        "takeaway": "Una fachada simplifica cómo usar la capacidad; no elimina sus errores ni sustituye sus garantías.",
        "notes": [
          "La fachada puede ser una clase o una función en un módulo existente. No requiere crear otro microservicio ni otra base.",
          "Evitar una fachada que reexpone los mismos campos del proveedor. El consumidor seguiría acoplado aunque la función tenga un nombre nuevo.",
          "La autorización y las reglas de negocio siguen teniendo responsables. La fachada no permite omitir validaciones porque la llamada sea más cómoda."
        ],
        "source": {
          "label": "Fachadas y contratos propuestos",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      },
      {
        "id": "fachada-e-interfaz-en-codigo",
        "chapter": "integracion",
        "kind": "code",
        "title": "El mismo consumidor, otra implementación",
        "lead": "El tipo declara la capacidad; desde fuera entregamos una implementación que la cumple.",
        "code": {
          "language": "typescript",
          "label": "Conceptual · contrato POS y fachada sin proveedor concreto",
          "highlights": "1-3|4-8|9-10",
          "source": "interface RegistroVentaPort {\n  registrar(op: VentaPos): Promise<ResultadoPos>;\n}\nclass IntegracionFacade {\n  constructor(private registro: RegistroVentaPort) {}\n  integrarVenta(op: VentaPos) {\n    return this.registro.registrar(op);\n  }\n}\n// Se inyecta la frontera: ACL + adaptador."
        },
        "takeaway": "Importar una interface del POS es distinto de importar el cliente de un proveedor en cada caso de uso.",
        "notes": [
          "Recorrer el código de arriba abajo: interface declara lo necesario; constructor recibe quien lo cumple; integrarVenta ofrece la entrada; registrar delega en la implementación.",
          "VentaPos y ResultadoPos son tipos conceptuales propios del POS. No son tablas del ERP ni respuestas de una biblioteca HTTP.",
          "Se omiten persistencia de intención, autorización, selección de destino y recuperación para centrar la explicación. Deben existir en el flujo real antes de invocar efectos externos.",
          "Una interface desaparece en ejecución de TypeScript; la configuración o mecanismo de inyección necesita una referencia real para conectar la implementación."
        ],
        "source": {
          "label": "Límites del código propuesto",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "acl-traduce-significado",
        "chapter": "integracion",
        "kind": "compare",
        "title": "ACL: traducir significado, no solo nombres",
        "lead": "ACL significa capa anticorrupción: evita que el modelo del proveedor se propague por el POS. Este proveedor es ficticio; no representa contratos de AX.",
        "columns": [
          {
            "title": "Dinero",
            "items": [
              "Proveedor: importe «11400», unidad pesos CLP.",
              "POS: valor decimal 11400 con moneda CLP explícita.",
              "No dividir por 100 sin conocer la unidad del contrato."
            ]
          },
          {
            "title": "Tiempo",
            "items": [
              "Proveedor: instante UTC con fecha y hora.",
              "POS: conservar ese instante y derivar fecha comercial con su política.",
              "No cortar el texto UTC para obtener una fecha local."
            ]
          },
          {
            "title": "Estado",
            "items": [
              "Proveedor: código QUEUED = recibido para procesar.",
              "POS: recibido, con referencia para seguimiento.",
              "No traducirlo como contabilizado ni como pago liquidado."
            ]
          }
        ],
        "takeaway": "La traducción requiere conocer unidades, calendario y estados reales; renombrar amount a total no alcanza.",
        "notes": [
          "La palabra anticorrupción se refiere a proteger el modelo de negocio frente a significados externos. No es una herramienta de ciberseguridad ni una lista de permisos.",
          "Todos los nombres y valores del proveedor de esta lámina son sintéticos. No describen una API existente de AX, Gira, facturación o pagos.",
          "La fecha comercial puede depender del calendario aprobado de la entidad; no siempre equivale a la fecha local del instante. Conservar ambas permite explicar diferencias.",
          "La ACL traduce equivalencias. No debe inventar una equivalencia cuando no existe, recalcular ofertas o declarar éxito ante evidencia desconocida."
        ],
        "source": {
          "label": "Capa anticorrupción · Microsoft",
          "url": "https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer"
        }
      },
      {
        "id": "acl-ejemplo-antes-despues",
        "chapter": "integracion",
        "kind": "code",
        "title": "Del dato externo a una respuesta del POS",
        "lead": "La ACL convierte unidades, fechas y estados según el contrato acordado.",
        "code": {
          "language": "typescript",
          "label": "Ejemplo ficticio · «recibido» todavía no es «contabilizado»",
          "highlights": "1-3|4-7|8-10",
          "source": "const dto = { amount: \"11400\", currency: \"CLP\",\n  at: \"2026-10-13T01:00:00Z\", status: \"QUEUED\" };\nconst instant = parseUtcInstant(dto.at);\nconst result = {\n  money: moneyFromMajorUnits(dto.amount, dto.currency),\n  occurredAt: instant,\n  businessDate: calendar.businessDate(instant),\n  status: dto.status === \"QUEUED\"\n    ? \"received\" : \"unknown\"\n};"
        },
        "takeaway": "La forma cambia para proteger el significado: moneda explícita, instante conservado y estado honesto.",
        "notes": [
          "Antes: un DTO ficticio combina valores en convenciones del proveedor. Después: el POS obtiene dinero con unidad conocida, tiempo interpretable y un resultado con significado acordado.",
          "moneyFromMajorUnits no convierte divisas. Valida moneda, representación decimal, escala y rangos según contrato; no utiliza división automática por 100 ni un number flotante para todo.",
          "calendar.businessDate usa contexto de país, entidad y sucursal acordado. No deduce el calendario del formato del string ni de la zona horaria del servidor.",
          "Solo se ilustra el caso QUEUED. El producto debe cubrir todos los estados soportados, validar entradas y separar error de traducción de resultado remoto incierto.",
          "Esta lámina no hace una llamada remota ni implementa reintentos. La referencia original y la evidencia del proveedor se conservan en el flujo completo."
        ],
        "source": {
          "label": "Semántica y contratos de integración POS",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "pregunta-frontera-de-integracion",
        "chapter": "integracion",
        "kind": "quiz",
        "title": "¿Dónde debe vivir esta diferencia?",
        "lead": "El proveedor ficticio cambia el código QUEUED por RECEIVED. Ambos significan «recibido para procesar», sin confirmar contabilización.",
        "question": "¿Qué cambio protege al resto del POS?",
        "options": [
          {
            "label": "Modificar cada pantalla para reconocer ambos códigos.",
            "correct": false,
            "feedback": "Las pantallas quedarían ligadas al vocabulario del proveedor. Un cambio futuro volvería a repartirse por el producto."
          },
          {
            "label": "Actualizar la traducción de la frontera y sus pruebas.",
            "correct": true,
            "feedback": "El POS sigue recibiendo su resultado «recibido». La ACL comprueba la equivalencia y el adaptador conserva el protocolo del destino."
          },
          {
            "label": "Devolver «contabilizado» para ocultar la diferencia.",
            "correct": false,
            "feedback": "Eso inventaría un resultado no demostrado. Simplificar una interfaz no permite cambiar el significado del hecho externo."
          }
        ],
        "takeaway": "Cambiar un código externo no debe cambiar el significado que el POS promete a sus usuarios.",
        "notes": [
          "Después de elegir, pedir que cada persona nombre una responsabilidad: la fachada ofrece la entrada; la ACL traduce; el adaptador conversa con el proveedor; el caso de uso decide negocio.",
          "Si el nuevo código tuviera otro significado, no bastaría sustituir una cadena. Habría que revisar contrato y comportamiento, y quizá evolucionar el resultado del POS.",
          "Ninguno de estos patrones garantiza entrega exactamente una vez ni atomicidad entre bases y proveedores externos."
        ],
        "source": {
          "label": "Traducción y extensibilidad del POS",
          "url": "../docs/extensibilidad-proveedores-dispositivos.md"
        }
      },
      {
        id: 'contrato-pos-independiente', chapter: 'integracion', kind: 'cards',
        title: 'El contrato expresa el negocio del POS',
        lead: 'No copiamos las tablas ni los estados internos del ERP al resto del producto.',
        items: [
          { title: 'Capacidad concreta', text: 'Registrar venta, registrar pago, consultar resultado o registrar devolución.' },
          { title: 'Identidad estable', text: 'Operación, entidad legal, país, destino y versión de contrato.' },
          { title: 'Dinero y tiempo', text: 'Moneda, escala, fecha del hecho, zona y fecha comercial explícitas.' },
          { title: 'Resultado con significado', text: 'Aceptado, rechazado, registrado, contabilizado o resultado desconocido.' }
        ],
        takeaway: 'Un HTTP 200 describe transporte; el contrato debe explicar qué ocurrió con el negocio.',
        notes: [
          'La fecha del hecho y la fecha contable pueden diferir. Ventas atrasadas y periodos cerrados necesitan una regla acordada con Finanzas.',
          'No extrapolar a Perú o España convenciones implícitas de importes enteros o identificadores existentes en Chile.',
          'El mismo intento conserva identidad y payload. Una corrección genera una operación relacionada y auditable; no modifica silenciosamente el intento original.',
          'El destino debe ofrecer unicidad y consulta fiable por referencia, o la limitación debe resolverse antes del piloto financiero.'
        ], source: proposal
      },
      {
        "id": "fachada-acl-adaptador",
        "chapter": "integracion",
        "kind": "compare",
        "title": "Ahora compara las tres responsabilidades",
        "lead": "La entrada que usamos, la traducción de significados y la conversación con el proveedor pueden vivir dentro del mismo módulo.",
        "columns": [
          {
            "title": "Fachada",
            "items": [
              "Ofrece una capacidad estable",
              "Oculta la coordinación interna",
              "Habla el contrato del POS"
            ]
          },
          {
            "title": "ACL",
            "items": [
              "Traduce significados entre modelos",
              "Mapea IDs, estados, dinero y fechas",
              "Evita filtrar conceptos del ERP"
            ]
          },
          {
            "title": "Adaptador",
            "items": [
              "Ejecuta el protocolo del destino",
              "Implementa REST, WCF, SDK u otro",
              "Devuelve evidencia y errores tipados"
            ]
          }
        ],
        "takeaway": "ACL significa capa anticorrupción; aquí no se refiere a una lista de control de acceso.",
        "notes": [
          "Una fachada que expone los mismos DTO y estados de AX sigue acoplando sus consumidores a AX. Renombrar campos no basta para independizar el modelo.",
          "La política de reintentos y el workflow monetario pertenecen a la aplicación. Las reglas de ofertas pertenecen al dominio de precios, no a la traducción AX.",
          "Las equivalencias requieren glosario y pruebas. Venta, pedido, deuda y documento fiscal no son sinónimos porque dos sistemas usen etiquetas parecidas."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "laboratorio-frontera-erp",
        "chapter": "integracion",
        "kind": "lab",
        "lab": "architecture-patterns",
        "title": "Sigue el dato por fachada, ACL y adaptador",
        "lead": "Otro caso: venta V-42 por CLP 12.900. Seguimos el dato hasta un ERP ficticio.",
        "takeaway": "La fachada ofrece la capacidad; la ACL traduce el significado; el adaptador realiza la llamada.",
        "notes": [
          "Todos los nombres de campos, IDs y estados del ERP de este ejemplo son inventados para enseñar. No describen el contrato de AX ni otro proveedor real.",
          "La venta ya está confirmada localmente y un worker integra su operación pendiente. No se llama al ERP desde la pantalla de cobro ni se vuelve a cobrar en este recorrido.",
          "Antes de cada paso pregunta qué componente debería conocer ese dato. La aplicación conoce saleId; la ACL conoce la equivalencia customerId/account; el adaptador conoce URL y protocolo.",
          "RECEIVED se traduce como recibido (status: received); BOOKED como registrado (status: registered) bajo el contrato ficticio del ejemplo. Recibido todavía necesita seguimiento; un código desconocido no demuestra éxito.",
          "El ejemplo enfoca responsabilidades. No implementa almacenamiento, autenticación, consulta de resultados, deduplicación remota o recuperación productiva."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        "id": "codigo-frontera-erp",
        "chapter": "integracion",
        "kind": "code",
        "title": "La diferencia del ERP queda en su frontera",
        "lead": "El consumidor usa la fachada. En la frontera asignada, la ACL traduce el significado y el adaptador ejecuta el protocolo.",
        "code": {
          "language": "typescript",
          "label": "Pseudocódigo · proveedor conceptual, no contrato real de AX",
          "highlights": "1-2|4-8",
          "source": "const result = await integration.integrarVenta(operation);\nawait outcomes.persist(operation.id, result);\n\nasync function registerInAssignedDestination(operation: VentaPos) {\n  const request = destinationAcl.toRequest(operation);\n  const evidence = await destinationAdapter.register(request);\n  return destinationAcl.toPosOutcome(evidence);\n}"
        },
        "takeaway": "La ACL protege significados; no hace atómica una llamada de red con PostgreSQL.",
        "notes": [
          "El fragmento omite expresamente el workflow completo para mostrar las dependencias. El producto debe persistir intención e identidad antes de invocar el adaptador.",
          "Si el destino aplica el efecto y se pierde la respuesta, debe consultarse la referencia o usar idempotencia remota demostrada. No repetir automáticamente con otro ID.",
          "toOperationOutcome no convierte cualquier excepción en rejected. Timeout y respuesta perdida pueden producir outcome_unknown.",
          "Los identificadores externos se almacenan con sistema, instancia, empresa y tipo de objeto. Una columna genérica id_externo no basta para la coexistencia."
        ],
        "source": {
          "label": "Casos adversos y recuperación",
          "url": "../docs/revision-resiliencia-datos-pos.md"
        }
      },
      {
        id: 'cambio-de-erp', chapter: 'integracion', kind: 'cards',
        title: 'Cambiar de ERP sin perder los pendientes',
        lead: 'La política asigna un destino a cada operación. Un reintento no elige simplemente el ERP que hoy está activo.',
        items: [
          { kicker: '1', title: 'Preparar contratos', text: 'Glosario, mappings y comparación con datos de referencia.' },
          { kicker: '2', title: 'Clasificar pendientes', text: 'No enviados, confirmados, rechazados, inciertos y dependientes.' },
          { kicker: '3', title: 'Cortar con identidad', text: 'Destino y época capturados; cajas atrasadas siguen una política explícita.' },
          { kicker: '4', title: 'Conciliar y retirar', text: 'Resolver históricos y dependencias antes de eliminar el adaptador anterior.' }
        ],
        takeaway: 'Revertir routing o binarios no deshace un asiento contable ya realizado.',
        notes: [
          'La comparación paralela debe ser en lectura o simulación. No enviar dos comandos reales de contabilización para comprobar si ambos ERPs coinciden.',
          'Una venta creada offline antes del corte conserva su contexto histórico; llegar tarde no determina por sí solo el nuevo destino.',
          'Una devolución nueva puede referir una venta del ERP anterior. Mantener referencias y tratamiento contable acordados en lugar de recrear la factura.',
          'La migración ERP y la del POS son programas relacionados, pero no equivalentes. Sustituir un adaptador no demuestra que todas las reglas y procesos del nuevo ERP sean compatibles.'
        ], source: resilience
      },
      {
        id: 'incorporar-pais', chapter: 'integracion', kind: 'compare',
        title: 'Ejemplo: incorporar un segundo perfil nacional',
        lead: 'El ejercicio debe mostrar exactamente qué reutilizamos, qué configuramos y qué desarrollamos.',
        columns: [
          { title: 'Reutilizar', items: ['Casos de uso de venta y caja', 'Outbox, auditoría e identidades', 'Pruebas del núcleo común'] },
          { title: 'Configurar', items: ['Entidad, moneda y formatos soportados', 'Módulos y permisos aprobados', 'Proveedores ya compatibles'] },
          { title: 'Implementar y homologar', items: ['Políticas nacionales faltantes', 'Adaptador del proveedor nuevo', 'Reglas y pruebas de la combinación'] }
        ],
        takeaway: 'El éxito se demuestra con el mismo producto y pruebas comunes, preservando diferencias explícitas.',
        notes: [
          'Una nueva regla puede exigir evolucionar el contrato o un módulo del núcleo. El criterio es una evolución compartida y controlada, no prohibir todo cambio.',
          'Homologar una combinación incluye núcleo, contrato, perfil, adaptador, SDK, sistema operativo, modelo y firmware cuando corresponde.',
          'No afirmar equivalencias fiscales entre países ni soporte universal de proveedores. Los nombres Chile, Perú y España ubican el alcance, no acreditan el cumplimiento de cada régimen.'
        ], source: extensions
      },
      {
        "id": "estructura-piezas-del-repositorio",
        "chapter": "monorepo",
        "kind": "cards",
        "title": "Cuatro palabras para leer el código",
        "lead": "Una estructura útil nos permite encontrar responsabilidades. Estas palabras describen niveles diferentes.",
        "items": [
          {
            "title": "Repositorio",
            "text": "Archivos con historial compartido. Un monorepo reúne varios proyectos; no obliga a desplegarlos juntos."
          },
          {
            "title": "Aplicación",
            "text": "Tiene un punto de arranque y se ejecuta. Ejemplos: interfaz de caja y backend de sucursal."
          },
          {
            "title": "Biblioteca",
            "text": "Código que otras piezas utilizan. Las funciones de cálculo no necesitan un servidor separado."
          },
          {
            "title": "Módulo",
            "text": "Agrupa una responsabilidad, como precios o ventas. Puede abarcar varias bibliotecas; no equivale a una carpeta."
          }
        ],
        "takeaway": "Repositorio organiza el trabajo; aplicación ejecuta; biblioteca reutiliza; módulo agrupa una responsabilidad.",
        "notes": [
          "Proyecto es aquí una unidad de código identificada y verificada. El árbol debe aclarar cuáles son aplicaciones y cuáles son bibliotecas.",
          "No crear una biblioteca por cada clase. Una separación sirve cuando ayuda a expresar una responsabilidad, su interfaz y sus pruebas.",
          "Repositorio: Conjunto de archivos con historial compartido. Un monorepo reúne varios proyectos relacionados; no obliga a desplegarlos juntos.",
          "Aplicación: Tiene un punto de arranque y se ejecuta en un entorno. Por ejemplo: la interfaz de caja o el backend que atiende a la sucursal.",
          "Biblioteca: Código que otras piezas utilizan. Las funciones de cálculo pueden ser una biblioteca sin convertirse en un servidor separado.",
          "Módulo: Agrupa una responsabilidad del negocio, como precios o ventas. Puede tener reglas, casos de uso y adaptadores en varias bibliotecas; no equivale necesariamente a una carpeta."
        ],
        "source": {
          "label": "Propuesta · Organización del producto",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "estructura-importar-no-es-llamar",
        "chapter": "monorepo",
        "kind": "compare",
        "title": "Usar código y llamar a un servicio",
        "lead": "Dos flechas pueden significar cosas distintas. Debemos nombrar la relación para entender sus consecuencias.",
        "columns": [
          {
            "title": "Dependencia de código",
            "items": [
              "sales usa funciones de pricing mediante un import.",
              "El cálculo puede ejecutarse dentro del mismo proceso.",
              "Cambiar la función exige comprobar a sus consumidores."
            ]
          },
          {
            "title": "Relación en ejecución",
            "items": [
              "La interfaz envía una solicitud al backend por HTTP.",
              "Son aplicaciones separadas y existe una conexión.",
              "La llamada puede fallar o quedar sin respuesta."
            ]
          },
          {
            "title": "Qué indica el árbol",
            "items": [
              "Muestra dónde se organiza el código y quién lo posee.",
              "No demuestra cuántos servidores están funcionando.",
              "El diagrama de despliegue explica dónde corre cada parte."
            ]
          }
        ],
        "takeaway": "Una biblioteca no es automáticamente un servicio. Un import no representa una llamada de red.",
        "notes": [
          "Proceso es un programa en ejecución. Biblioteca es código reutilizable que una aplicación puede incluir en su proceso.",
          "Si dibujamos ventas → precios, debemos decir si significa importación de código o solicitud entre aplicaciones. Cambiar la segunda requiere tratar tiempos de espera, errores y compatibilidad del contrato."
        ],
        "source": {
          "label": "Propuesta · Organización del producto",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "estructura-leer-responsabilidades",
        "chapter": "monorepo",
        "kind": "tree",
        "title": "Leer el árbol por responsabilidades",
        "lead": "Los nombres deben ayudarnos a decidir dónde modificar una regla y dónde conectar un proveedor.",
        "code": {
          "language": "plaintext",
          "label": "Estructura ilustrativa · no representa procesos separados",
          "source": "apps/\n  pos-desktop/   pos-runtime/   erp-worker/\nlibs/\n  pricing/       sales/         erp/\n  contracts/     shared-kernel/"
        },
        "items": [
          {
            "title": "Apps componen y arrancan",
            "text": "Interfaz, backend y worker seleccionan sus dependencias. El worker continúa sin una pantalla abierta."
          },
          {
            "title": "Módulos conservan su tema",
            "text": "pricing guarda precios; erp, integración; contracts, acuerdos; shared-kernel, conceptos mínimos comunes."
          },
          {
            "title": "Dónde encaja Nx",
            "text": "Organiza proyectos y automatiza verificaciones. Las responsabilidades y los límites los decide el equipo."
          }
        ],
        "takeaway": "Primero elegimos responsabilidades y límites; las carpetas y herramientas ayudan a mantenerlos.",
        "notes": [
          "El árbol es una propuesta. No afirma que todas estas aplicaciones estén implementadas en la maqueta.",
          "Nx aparece solo como herramienta de construcción y coordinación del repositorio. Su instalación, configuración y uso detallado quedan fuera de esta presentación.",
          "Los módulos pueden contener capas internas cuando la separación sea útil. No se necesita repartir una función sencilla entre muchas carpetas para llamarla arquitectura.",
          "Apps componen y arrancan: La interfaz, el backend y el worker eligen las piezas que necesitan. Un worker ejecuta trabajo en segundo plano; no depende de una pantalla abierta.",
          "Módulos conservan su tema: pricing contiene reglas de precios; erp, la integración externa. contracts define los datos acordados. shared-kernel guarda pocos conceptos comunes, como dinero e identidad.",
          "Dónde encaja Nx: Ayuda al equipo a organizar proyectos y automatizar verificaciones. No decide las responsabilidades, no reemplaza el backend y no convierte cada biblioteca en un servicio."
        ],
        "source": {
          "label": "Nx · Función de la herramienta",
          "url": "https://nx.dev/docs/getting-started/intro"
        }
      },
      {
        "id": "arbol-nx",
        "chapter": "monorepo",
        "kind": "tree",
        "title": "El árbol completo del POS propuesto",
        "lead": "Ubicamos aplicaciones y módulos. Compartir repositorio no obliga a desplegarlos juntos.",
        "code": {
          "source": "apps/\n  pos-desktop/     pos-runtime/     pos-sync-worker/\n  country-api/     erp-worker/      backoffice/\nlibs/\n  sales/          cash/            pricing/\n  payments/       returns/         fiscal/\n  erp/            sync/\n  contracts/      shared-kernel/   ui/\n# Dentro de un dominio, cuando aporte un límite real:\nlibs/pricing/{domain, application, infrastructure}/"
        },
        "items": [
          {
            "title": "Apps",
            "text": "Componen dependencias y producen ejecutables o despliegues."
          },
          {
            "title": "Dominios",
            "text": "Poseen reglas, contratos públicos, datos y pruebas."
          },
          {
            "title": "Capas internas",
            "text": "Separan reglas, casos de uso y accesos técnicos donde es necesario."
          }
        ],
        "takeaway": "Cada módulo conserva su responsabilidad y su interfaz; una carpeta no garantiza ese límite.",
        "notes": [
          "Este árbol es una organización propuesta del producto futuro. No afirma que todos estos procesos existan ya en la maqueta.",
          "pos-desktop incorpora Angular y el proyecto Tauri; pos-runtime es el backend de sucursal del perfil WAN. Los workers se supervisan independientemente de la UI.",
          "No crear una biblioteca por cada clase o carpeta. Separar proyectos cuando exista una responsabilidad y una frontera que podamos comprobar.",
          "Evitar un shared gigantesco que exponga ORM y modelos de todos los módulos. shared-kernel conserva tipos mínimos como dinero e identidad."
        ],
        "source": {
          "label": "Tecnologías y monorepo",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        "id": "estructura-ejercicio-ubicar-cambio",
        "chapter": "monorepo",
        "kind": "quiz",
        "title": "Ejercicio · ¿Dónde harías cada cambio?",
        "lead": "A: cambiar el descuento máximo. B: cambiar la URL de envío HTTP del ERP. ¿Dónde comienza cada modificación?",
        "question": "¿Dónde ubicar una regla del negocio y una traducción de proveedor?",
        "options": [
          {
            "label": "A en las reglas de precios; B en el adaptador HTTP del ERP.",
            "correct": true,
            "feedback": "La regla comercial pertenece a precios. La URL y el protocolo pertenecen al adaptador. Si cambia el significado de un estado externo, revisamos la ACL y sus pruebas."
          },
          {
            "label": "Ambos cambios dentro de la pantalla de venta.",
            "correct": false,
            "feedback": "La pantalla presenta y recoge decisiones del usuario. Guardar allí reglas compartidas o traducciones del ERP las acopla a esa interfaz y dificulta reutilizarlas."
          },
          {
            "label": "Ambos cambios en shared-kernel porque afectan a varias aplicaciones.",
            "correct": false,
            "feedback": "Compartir consumidores no convierte todo en un concepto común. Precios conserva sus reglas y la integración conserva detalles del proveedor; shared-kernel debe seguir siendo pequeño."
          }
        ],
        "takeaway": "Ubicamos el cambio por la responsabilidad que representa, no por la primera carpeta que encontramos.",
        "notes": [
          "Un adaptador implementa la conexión técnica con un sistema externo. Mantener un contrato interno permite sustituir esa conexión sin dispersar su formato por todo el POS.",
          "Pedir al equipo que nombre una prueba para cada cambio: límite del descuento y traducción del formato ERP. El ejemplo no llama a un ERP ni cambia precios reales."
        ],
        "source": {
          "label": "Propuesta · Organización del producto",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        id: 'reglas-de-dependencia', chapter: 'monorepo', kind: 'compare',
        title: 'El dominio debe poder probarse sin el framework',
        lead: 'Las dependencias apuntan hacia contratos y reglas, no hacia detalles de un proveedor.',
        columns: [
          { title: 'Domain', items: ['Reglas y tipos de negocio', 'Sin Angular, Nest, SQL ni SDK', 'Pruebas puras y deterministas'] },
          { title: 'Application', items: ['Casos de uso y coordinación', 'Puertos que necesita el dominio', 'Autorización y unidad de trabajo'] },
          { title: 'Infrastructure', items: ['PostgreSQL y clientes técnicos', 'Adaptadores y traducciones', 'Composición en las aplicaciones'] }
        ],
        takeaway: 'La interfaz consume contratos públicos; nunca credenciales o repositorios de base de datos.',
        notes: [
          'La separación por capas se aplica dentro de cada dominio cuando sea útil. No crear carpetas globales que hagan difícil identificar al dueño de una regla.',
          'Cada módulo controla su interfaz pública y sus migraciones. Otro módulo no lee libremente su ORM porque ambos estén en el mismo monorepo.',
          'La separación de importaciones no sustituye permisos SQL, controles de ejecución o contratos de protocolos. Todos esos límites requieren mecanismos propios.'
        ], source: technology
      },
      {
        "id": "limites-nx-en-ci",
        "chapter": "monorepo",
        "kind": "cards",
        "title": "Las fronteras necesitan una comprobación",
        "lead": "El árbol de carpetas comunica una intención. Las reglas y las pruebas comprueban que el código la respeta.",
        "takeaway": "Nx ayuda a organizar y comprobar proyectos; no reemplaza el diseño ni las pruebas del producto.",
        "notes": [
          "En este curso importa poder formular la regla antes de configurar una herramienta. La configuración detallada de Nx y ESLint pertenece a una sesión específica.",
          "Una regla de importaciones no controla por sí sola SQL, permisos de ejecución o contratos de red. Cada frontera necesita su mecanismo y su prueba.",
          "Ejercicio oral: ¿por qué compilar correctamente no demostraría que el módulo de precios está aislado de un proveedor? Pedir una importación prohibida concreta y una prueba independiente."
        ],
        "source": {
          "label": "Estructura y límites propuestos",
          "url": "../docs/opciones-tecnologicas.md"
        },
        "items": [
          {
            "title": "Una regla explícita",
            "text": "Precios calcula con sus datos de entrada. No importa el SDK de pagos ni las tablas del ERP."
          },
          {
            "title": "Una revisión automática",
            "text": "Las herramientas de código detectan importaciones prohibidas y ciclos entre proyectos."
          },
          {
            "title": "Una prueba de comportamiento",
            "text": "Las pruebas de contratos, permisos y datos verifican límites que el árbol de dependencias no puede demostrar."
          }
        ]
      },
      {
        "id": "cadena-de-verificacion",
        "chapter": "monorepo",
        "kind": "cards",
        "title": "Comprobar el producto por capas",
        "lead": "Cada tipo de prueba demuestra una responsabilidad distinta.",
        "items": [
          {
            "title": "Reglas puras",
            "text": "Precios, ofertas, redondeos, límites y casos de referencia."
          },
          {
            "title": "Contratos",
            "text": "Productor y consumidor compatibles; variantes de proveedor y país."
          },
          {
            "title": "Persistencia",
            "text": "Restricciones, transacciones, duplicados y activación atómica."
          },
          {
            "title": "Recuperación",
            "text": "Cortes en fronteras, replay, restauración y efectos inciertos."
          }
        ],
        "takeaway": "Un build exitoso no demuestra que una venta sobreviva a un fallo.",
        "notes": [
          "Las verificaciones automáticas comprueban reglas, contratos y recuperación. La herramienta que las ejecuta no sustituye esas pruebas.",
          "Comprobar cada aplicación en su entorno de ejecución y con sus contratos. Compartir código no demuestra compatibilidad entre versiones.",
          "Los componentes nativos necesitan pruebas propias de firma, sistema operativo y periféricos, además de las pruebas de las reglas de negocio."
        ],
        "source": {
          "label": "Tecnologías y monorepo",
          "url": "../docs/opciones-tecnologicas.md"
        }
      },
      {
        id: 'versiones-y-anillos', chapter: 'monorepo', kind: 'cards',
        title: 'Desplegar una combinación compatible',
        lead: 'Las cajas pueden permanecer desconectadas mientras el país evoluciona. Las versiones mixtas son parte del diseño.',
        items: [
          { kicker: '1', title: 'Versionar', text: 'Contrato, núcleo, perfiles, adaptadores y artefactos identificables.' },
          { kicker: '2', title: 'Homologar', text: 'Validar la combinación con proveedor, SDK, sistema operativo y dispositivo.' },
          { kicker: '3', title: 'Desplegar por anillos', text: 'Laboratorio, piloto y ampliación con evidencia y responsables.' },
          { kicker: '4', title: 'Recuperar', text: 'Reversión compatible con datos, operaciones pendientes y esquemas.' }
        ],
        takeaway: 'Mismo commit no significa despliegue simultáneo ni compatibilidad automática.',
        notes: [
          'El esquema nuevo debe convivir durante el horizonte acordado con clientes, mensajes y restauraciones antiguos. Expandir, migrar y retirar de forma controlada.',
          'Una versión instalada no demuestra compatibilidad. El catálogo debe registrar qué combinaciones están en laboratorio, homologadas, en piloto o retiradas.',
          'Revertir binarios puede ser inseguro tras una migración destructiva. La estrategia de rollback necesita demostrar lectura de datos y recuperación de intentos previos.',
          'Las verificaciones automáticas de un dispositivo nuevo no deben generar cobros, documentos fiscales o impresiones sorpresivas.'
        ], source: extensions
      },
      {
        id: 'reutilizar-plataforma', chapter: 'monorepo', kind: 'compare',
        title: 'Reutilizar la plataforma corporativa con límites',
        lead: 'Consumir piezas compatibles evita duplicar trabajo. La operación de sucursal conserva sus dependencias locales.',
        columns: [
          { title: 'Bibliotecas de core', items: ['Logs, correlación y contratos', 'Paquetes versionados y responsables', 'Arranque local sin servicios centrales'] },
          { title: 'APIs corporativas', items: ['Capacidades y dueños confirmados', 'Datos necesarios distribuidos a tienda', 'No consulta remota por cada venta offline'] },
          { title: 'devops-platform', items: ['Acciones CI/CD fijadas por versión', 'Adaptación a artefactos y flota POS', 'Entrega a tienda validada por separado'] }
        ],
        takeaway: 'Reutilizar código no implica heredar todas las dependencias de ejecución del sistema original.',
        notes: [
          'El repositorio corporativo llamado core y el núcleo de dominio POS son conceptos diferentes. Una biblioteca se adopta por contrato y evidencia, no por su nombre.',
          'Las APIs corporativas pueden participar en publicación de maestros e integración central. No deben convertirse en requisito sincrónico para una venta habilitada offline.',
          'La propuesta recomienda un monorepo POS con releases propios que consume bibliotecas y acciones corporativas. La ubicación definitiva y propiedad deben acordarse.',
          'Las acciones existentes de despliegue cloud no acreditan distribución, firma, actualización y recuperación de la flota de sucursales.'
        ], source: corporate
      },
      {
        id: 'observabilidad-y-recuperacion', chapter: 'operacion', kind: 'cards',
        title: 'Operar con evidencia y una acción posible',
        lead: 'Una alerta útil identifica el ámbito, la causa probable y quién puede resolverlo.',
        items: [
          { title: 'Pendientes', text: 'Cantidad, antigüedad, destino, causa y capacidad de recuperación.' },
          { title: 'Precios', text: 'Versión activa, recibida y aplicada, vigencia y resultado de validación.' },
          { title: 'Efectos inciertos', text: 'Intentos de pago, fiscalidad o ERP que necesitan consulta o conciliación.' },
          { title: 'Restauración', text: 'RPO/RTO por fallo, exclusión del escritor anterior y ensayo con replay.' }
        ],
        takeaway: 'Una cola vacía no demuestra que el dinero y los documentos estén conciliados.',
        notes: [
          'Correlacionar con eventId, operationId, saleId y traceId según la frontera. No registrar datos de tarjeta ni secretos; limitar acceso y retención de datos personales.',
          'La conciliación compara conteos, importes por moneda, referencias, medios de pago y día comercial. Una proyección incompleta muestra su cobertura y frescura.',
          'El commit local no recupera un disco destruido. El ACK central no evita que un restore retroceda a antes de ese ACK: se necesita retención y reconciliación del historial.',
          'El antiguo escritor y el restaurado no pueden operar simultáneamente con la misma autoridad. Definir identidad, época y fencing del procedimiento.'
        ], source: resilience
      },
      {
        id: 'capacidad-del-backlog', chapter: 'operacion', kind: 'compare',
        title: 'La cola solo se vacía si hay capacidad sobrante',
        lead: 'Reconectar todas las sucursales a la vez puede saturar el ERP aunque cada tienda funcione bien.',
        columns: [
          { title: 'Medir', items: ['Trabajo nuevo por unidad de tiempo', 'Éxitos efectivos por destino', 'Tamaño y antigüedad del backlog'] },
          { title: 'Regular', items: ['Concurrencia y caudal acotados', 'Backoff con dispersión temporal', 'Admisión escalonada tras reconexión'] },
          { title: 'Demostrar', items: ['Recuperación con tráfico nuevo', 'Presupuesto y ventanas reales', 'Sin descartar obligaciones para vaciar'] }
        ],
        takeaway: 'Si completamos tanto como llega, el atraso no disminuye.',
        notes: [
          'Ejemplo educativo: backlog de 600 trabajos, 10 nuevos por minuto y 30 éxitos por minuto da aproximadamente 30 minutos de drenaje, si las tasas se mantienen y los trabajos son comparables.',
          'La aproximación es backlog dividido por capacidad de éxito menos llegadas. No es un SLA: dependencias, cuotas, tamaños y reintentos pueden cambiar el resultado.',
          'Contar mensajes puede ocultar lotes de miles de registros. Medir también bytes, registros y tiempo de servicio por destino.',
          'La ventana de recuperación debe conservar capacidad para tráfico nuevo. Un mensaje inválido necesita cuarentena; una operación monetaria no se elimina solo por superar intentos o TTL.'
        ], source: resilience
      },
      {
        id: 'pregunta-ack-perdido', chapter: 'operacion', kind: 'quiz',
        title: 'Comprueba la entrega durable',
        lead: 'País confirmó inbox, efecto y outbox, pero el ACK no llegó a sucursal.',
        question: '¿Cómo debe reenviar la sucursal?',
        options: [
          { label: 'Con el mismo eventId y el mismo contenido.', correct: true, feedback: 'El receptor reconoce la identidad y devuelve un resultado equivalente sin repetir el efecto local.' },
          { label: 'Con un ID nuevo para que la cola no lo rechace.', correct: false, feedback: 'Un ID nuevo oculta que es el mismo intento y puede producir un efecto duplicado.' },
          { label: 'No reenvía: cualquier timeout equivale a confirmación.', correct: false, feedback: 'La sucursal todavía no tiene el acuse acordado. Debe recuperar el resultado mediante el protocolo.' }
        ],
        takeaway: 'La identidad sobrevive a los reintentos; la garantía depende del contrato y su retención.',
        notes: [
          'Preguntar además qué pasa si el mismo ID trae otro payload: se rechaza como conflicto, no se acepta como actualización.',
          'El resultado equivalente aquí corresponde al efecto local del receptor. No acredita contabilización ERP ni liquidación de pago.',
          'Completar el ejercicio con restore anterior al ACK: una deduplicación que retrocedió necesita reconstrucción y conciliación; no basta conservar filas mientras todo marcha bien.'
        ], source: resilience
      },
      {
        id: 'pregunta-pais-nuevo', chapter: 'operacion', kind: 'quiz',
        title: 'Comprueba el objetivo corporativo',
        lead: 'El siguiente país requiere un proveedor fiscal que todavía no soportamos.',
        question: '¿Qué cambio respeta la propuesta?',
        options: [
          { label: 'Copiar el repositorio y mantener un POS por país.', correct: false, feedback: 'Crea forks que duplican reglas y pruebas. La meta es evolucionar un producto común.' },
          { label: 'Agregar el nombre del proveedor al perfil y activarlo.', correct: false, feedback: 'Configuración no implementa un protocolo inexistente ni demuestra homologación.' },
          { label: 'Implementar su extensión, validar contratos y homologar el perfil.', correct: true, feedback: 'Se conserva el núcleo donde aplica y se evoluciona lo necesario con pruebas de regresión y compatibilidad.' }
        ],
        takeaway: 'El producto común evoluciona: no ignora las diferencias ni promete resolverlas todas con parámetros.',
        notes: [
          'Si la nueva regla no cabe en el contrato vigente, se propone una evolución compatible del contrato y los módulos afectados. No esconderla dentro de un adaptador incorrecto.',
          'La evidencia incluye qué código se compartió, qué configuración cambió, qué extensión se implementó y qué combinación quedó homologada.',
          'La fiscalidad requiere validación del régimen y proveedor correspondientes. Esta pregunta enseña la organización del software, no una solución jurídica universal.'
        ], source: proposal
      },
      {
        "id": "explicar-tu-diseno",
        "chapter": "operacion",
        "kind": "cards",
        "title": "Antes de implementar: explica tu diseño",
        "lead": "Trabaja en parejas. Usa una venta y un cambio de proveedor para demostrar qué entendiste.",
        "items": [
          {
            "title": "Dibuja el contexto",
            "text": "Ubica al cajero, el POS y el ERP. Explica el significado de cada flecha."
          },
          {
            "title": "Amplía la sucursal",
            "text": "Separa cliente, backend y base de datos. Explica qué sigue disponible sin Internet."
          },
          {
            "title": "Ubica dos cambios",
            "text": "Una regla de descuento y un estado nuevo del ERP. Indica módulos, contratos y pruebas afectados."
          },
          {
            "title": "Explica un fallo",
            "text": "El ERP recibió la operación, pero se perdió la respuesta. Explica por qué no debes cobrar ni enviar con otro ID."
          }
        ],
        "takeaway": "Si no puedes justificar una flecha o una carpeta, vuelve a ese bloque antes de escribir código.",
        "notes": [
          "Respuesta esperada C1: el cajero usa POS; POS integra operaciones con ERP. C2 agrega aplicaciones y almacenamiento sin confundirlos con carpetas o servidores físicos.",
          "La regla comercial pertenece al dominio de precios; el significado de un nuevo estado ERP pertenece a la ACL, con revisión del contrato y de la recuperación de resultados.",
          "El caso de fallo mantiene identidad y estado pendiente o desconocido. Debe consultar la referencia o conciliar según el contrato, sin asumir fracaso ni crear un nuevo efecto monetario.",
          "Valora la explicación causal, no la repetición de nombres. Si el participante confunde módulo y proceso, revisa arquitectura; si interpreta RECEIVED como registrado, revisa patrones y el laboratorio.",
          "Completar diapositivas o acertar preguntas no acredita competencia para operar dinero real. La siguiente evidencia es resolver un cambio pequeño con pruebas y revisión del equipo."
        ],
        "source": {
          "label": "Propuesta y decisiones",
          "url": "../docs/propuesta-arquitectura.md"
        }
      },
      {
        id: 'criterios-del-piloto', chapter: 'operacion', kind: 'closing',
        title: 'El siguiente paso es demostrar el producto',
        lead: 'Un corte vertical y un segundo perfil nacional deben probar reutilización, integridad y operación recuperable.',
        items: [
          { title: 'Producto común', text: 'Mismo núcleo, contratos claros y extensiones nacionales identificadas.' },
          { title: 'Evidencia técnica', text: 'Precios coherentes, venta durable, entrega, ERP y fallos recuperados.' },
          { title: 'Operación gobernada', text: 'Responsables, compatibilidad, observabilidad y despliegue gradual.' }
        ],
        links: [
          { label: 'Propuesta y ADR', url: '../docs/propuesta-arquitectura.md' },
          { label: 'Diagramas editables', url: '../docs/diagramas-excalidraw/index.html' },
          { label: 'Pruebas del piloto', url: '../docs/validacion-y-decisiones.md' },
          { label: 'POS Platform', url: 'index.html' }
        ],
        takeaway: 'Una plataforma que incorpora países sin rehacer el POS, con garantías que el equipo puede explicar y probar.',
        notes: [
          'Acordar primero capacidades comunes, variantes nacionales, propietarios y evidencia de aceptación. Evitar convertir la selección de herramientas en el objetivo del piloto.',
          'El corte vertical cubre una venta, caja, pago, documento, commit, entrega, integración y trazabilidad. El segundo perfil demuestra qué se reutiliza y qué se extiende.',
          'Probar desconexión, resultado incierto, descarga parcial, duplicados, restauración y versiones mixtas. Conservar datos y resultados; esta presentación no sustituye esas pruebas.',
          'BullMQ y RabbitMQ entran solamente si sus casos justifican la operación adicional. La base puede validar sus invariantes antes de añadir ambos.',
          'Los ejemplos son educativos y utilizan datos ficticios. Antes de convertirlos en producto deben cerrarse contratos, controles, homologación y responsabilidad operativa.'
        ], source: proposal
      }
    ],
    glossary: [
      {
        "term": "Núcleo común",
        "meaning": "Casos de uso, reglas y contratos que el producto comparte entre países."
      },
      {
        "term": "Perfil",
        "meaning": "Configuración completa, versionada y aprobada para país, entidad, sucursal y caja."
      },
      {
        "term": "Homologación",
        "meaning": "Evidencia de que una combinación concreta de software, proveedor y dispositivo cumple su contrato."
      },
      {
        "term": "C4",
        "meaning": "Vistas de contexto, contenedores, componentes y código para explicar un sistema a distintas escalas."
      },
      {
        "term": "LAN / WAN",
        "meaning": "Red de sucursal / conexión entre la sucursal y plataformas externas. Perder una no equivale a perder la otra."
      },
      {
        "term": "Autoridad",
        "meaning": "Sistema o módulo responsable de aceptar y corregir un dato o efecto de negocio."
      },
      {
        "term": "Outbox",
        "meaning": "Registro durable de eventos a entregar, escrito en la misma transacción que el cambio de negocio."
      },
      {
        "term": "Inbox",
        "meaning": "Registro durable de entradas e identidad, utilizado junto al efecto local para recuperar y reconocer reenvíos."
      },
      {
        "term": "ACK",
        "meaning": "Acuse con una garantía acotada a quien lo emite. Debe aclararse si es de aplicación, consumidor o transporte."
      },
      {
        "term": "Idempotencia",
        "meaning": "Repetir el mismo intento reconocido no produce otra vez el efecto definido por el contrato."
      },
      {
        "term": "Snapshot",
        "meaning": "Conjunto de datos coherente asociado a una versión y punto de continuidad del origen."
      },
      {
        "term": "Delta",
        "meaning": "Cambio incremental con identidad, ámbito, versión y reglas de orden o cobertura."
      },
      {
        "term": "Watermark",
        "meaning": "Punto consistente del origen que permite enlazar un snapshot con cambios posteriores."
      },
      {
        "term": "Staging",
        "meaning": "Área aislada donde se recibe y prepara información sin modificar la versión activa."
      },
      {
        "term": "Candidata",
        "meaning": "Versión preparada para validación; todavía no está publicada para nuevas operaciones."
      },
      {
        "term": "Cursor aplicado",
        "meaning": "Checkpoint que avanza cuando el efecto y su publicación quedaron confirmados, no solamente descargados."
      },
      {
        "term": "Backoff",
        "meaning": "Espera creciente entre reintentos; la dispersión temporal evita que todos reintenten juntos."
      },
      {
        "term": "Backlog",
        "meaning": "Trabajo pendiente durable, medido también por antigüedad y carga real."
      },
      {
        "term": "Claim / lease",
        "meaning": "Propiedad temporal de un trabajo; necesita controles contra confirmaciones tardías de un worker que perdió la propiedad."
      },
      {
        "term": "Fachada",
        "meaning": "Interfaz de una capacidad que oculta cómo se coordina su implementación."
      },
      {
        "term": "ACL",
        "meaning": "Anti-Corruption Layer: traduce significados entre modelos sin propagar detalles del sistema externo."
      },
      {
        "term": "Adaptador",
        "meaning": "Implementación técnica de un puerto: protocolo, SDK o acceso al proveedor."
      },
      {
        "term": "Monorepo",
        "meaning": "Repositorio con varios proyectos; no implica que todos se desplieguen o ejecuten juntos."
      },
      {
        "term": "Nx",
        "meaning": "Herramientas de desarrollo y CI para organizar proyectos, dependencias y tareas. No es runtime de la venta."
      },
      {
        "term": "RPO / RTO",
        "meaning": "Objetivos de pérdida de datos tolerable / tiempo de recuperación, definidos para un ámbito y fallo concretos."
      },
      {
        "term": "Resultado desconocido",
        "meaning": "No hay evidencia concluyente de éxito o rechazo; requiere consulta o conciliación antes de repetir un efecto."
      },
      {
        "term": "Conciliación",
        "meaning": "Comparación de referencias, estados, conteos e importes para identificar y resolver diferencias."
      },
      {
        "term": "Monolito modular",
        "meaning": "Una aplicación que se ejecuta como un proceso y organiza sus responsabilidades en módulos con contratos explícitos. No obliga a mezclar sus reglas ni sus datos."
      },
      {
        "term": "Patrón",
        "meaning": "Solución conocida a un problema repetido, con condiciones y costes. No es una herramienta que se instala ni una garantía por su nombre."
      },
      {
        "term": "Acoplamiento",
        "meaning": "Cuánto debe conocer una parte sobre los detalles de otra; cuanto más conoce, más cambios pueden propagarse entre ellas."
      },
      {
        "term": "Puerto",
        "meaning": "Contrato que expresa una capacidad o conversación que necesita el POS. Aquí no significa puerto TCP ni número de red."
      },
      {
        "term": "Interfaz de código",
        "meaning": "Declaración de operaciones, entradas y resultados. Una interface de TypeScript puede expresar un puerto, pero no implementa su comportamiento."
      },
      {
        "term": "Inyección de dependencia",
        "meaning": "Entregar a una pieza la implementación que necesita desde la composición de la aplicación, en vez de que cree directamente su proveedor concreto."
      },
      {
        "term": "DTO",
        "meaning": "Objeto que transporta datos entre partes. Su estructura no garantiza que ambas interpreten igual sus campos, unidades o estados."
      },
      {
        "term": "Semántica",
        "meaning": "Significado de un dato: su unidad, contexto y lo que realmente afirma, además de su nombre o formato."
      },
      {
        "term": "Comando",
        "meaning": "Petición dirigida a un responsable para ejecutar una acción. Puede ser aceptada o rechazada; todavía no acredita que ocurrió."
      },
      {
        "term": "Evento",
        "meaning": "Mensaje que describe un hecho ya ocurrido, publicado por quien lo confirmó. No ordena repetir ese hecho en cada consumidor."
      },
      {
        "term": "Job",
        "meaning": "Trabajo identificado que debe ejecutarse, con parámetros, estado y política de recuperación."
      },
      {
        "term": "Cola",
        "meaning": "Mecanismo que mantiene trabajo pendiente hasta que pueda procesarse. Su recuperación y retención deben configurarse y verificarse."
      },
      {
        "term": "Worker",
        "meaning": "Proceso que ejecuta trabajo pendiente y registra su resultado; puede operar independientemente de la interfaz del cajero."
      },
      {
        "term": "Síncrono",
        "meaning": "Coordinación en la que quien solicita necesita esperar el resultado para continuar esa operación."
      },
      {
        "term": "Asíncrono",
        "meaning": "Coordinación en la que se registra una responsabilidad pendiente y su resultado se obtiene después; no significa éxito automático."
      },
      {
        "term": "Transacción",
        "meaning": "Grupo de cambios que se confirma o revierte como una unidad dentro de una base. No engloba automáticamente efectos en otros sistemas."
      },
      {
        "term": "Checksum",
        "meaning": "Huella calculada para comparar bytes con un valor esperado de una fuente confiable. No comprueba por sí sola las reglas comerciales."
      },
      {
        "term": "Activación",
        "meaning": "Publicación de una candidata validada como versión disponible para nuevas operaciones, junto con su progreso aplicado."
      },
      {
        "term": "Fecha comercial",
        "meaning": "Fecha de negocio asignada según calendario y reglas de la entidad. Puede diferir de la fecha UTC del instante de una operación."
      },
      {
        "term": "Arquitectura",
        "meaning": "Decisiones sobre responsabilidades, colaboración, datos y tratamiento de fallos de un sistema."
      },
      {
        "term": "Frontend",
        "meaning": "Parte de la aplicación que presenta información y recibe acciones de la persona usuaria."
      },
      {
        "term": "Backend",
        "meaning": "Aplicación que atiende solicitudes, aplica reglas y coordina datos o efectos. Puede ejecutarse en una sucursal, no necesariamente en Internet."
      },
      {
        "term": "API",
        "meaning": "Interfaz acordada para usar capacidades de otro software: operaciones, entradas, respuestas, errores y condiciones."
      },
      {
        "term": "Base de datos",
        "meaning": "Sistema para guardar y consultar información; sus garantías dependen del diseño, la configuración y la recuperación."
      },
      {
        "term": "Módulo",
        "meaning": "Agrupación de una responsabilidad, como precios o ventas, con reglas e interfaces propias. Puede abarcar varias bibliotecas."
      },
      {
        "term": "Proceso",
        "meaning": "Programa en ejecución. Una aplicación puede usar bibliotecas dentro del mismo proceso."
      },
      {
        "term": "Contrato",
        "meaning": "Acuerdo sobre cómo colaborar: entradas, resultados, errores y condiciones, además del significado de cada dato."
      },
      {
        "term": "Contenedor C4",
        "meaning": "Aplicación o almacén de datos del modelo de arquitectura. No presupone utilizar Docker."
      },
      {
        "term": "Componente C4",
        "meaning": "Parte interna de una aplicación o contenedor, con responsabilidades e interfaces; no implica otro microservicio."
      },
      {
        "term": "Despliegue",
        "meaning": "Ubicación de instancias del software en equipos o entornos de ejecución."
      },
      {
        "term": "Cotización",
        "meaning": "Resultado de calcular el importe bajo condiciones y vigencia definidas. No equivale a una venta pagada o confirmada."
      },
      {
        "term": "Repositorio / monorepo",
        "meaning": "Archivos e historial compartido. Un monorepo reúne varios proyectos relacionados; no obliga a ejecutarlos o desplegarlos juntos."
      },
      {
        "term": "Aplicación",
        "meaning": "Código con un punto de arranque que se ejecuta en un entorno y puede consumir bibliotecas."
      },
      {
        "term": "Biblioteca",
        "meaning": "Código reutilizable utilizado por otra pieza. No implica por sí solo un proceso separado ni una llamada de red."
      },
      {
        "term": "Importación",
        "meaning": "Uso de código de otra pieza. Expresa una dependencia de código, no necesariamente una comunicación entre servicios."
      },
      {
        "term": "Interfaz pública del módulo",
        "meaning": "Funciones o contratos que otras piezas pueden utilizar sin conocer los detalles internos del módulo."
      },
      {
        "term": "Shared kernel",
        "meaning": "Conjunto pequeño y controlado de conceptos realmente compartidos, como dinero o identidad; no una carpeta para toda función reutilizable."
      },
      {
        "term": "Commit de base de datos",
        "meaning": "Confirmación de los cambios de una transacción en esa base. No confirma por sí sola un efecto remoto."
      },
      {
        "term": "Commit de Git",
        "meaning": "Registro de una versión del código en su historial. No equivale a una transacción de venta ni a un despliegue."
      }
    ],
    sources: [
      proposal, c4, technology, messaging, resilience, extensions, corporate,
      { label: 'Revisión corporativa y evolución ERP', url: '../docs/revision-arquitectura-corporativa.md' },
      { label: 'Validación y decisiones del piloto', url: '../docs/validacion-y-decisiones.md' },
      { label: 'Fuentes y diagramas Excalidraw', url: '../docs/diagramas-excalidraw/index.html' }
    ]
  };
})();
