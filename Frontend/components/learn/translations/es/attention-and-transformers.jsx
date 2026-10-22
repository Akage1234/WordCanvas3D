import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig, ArticleLink, Callout } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/attention-and-transformers.module.css";
import { AttentionLines, AttentionMatrix, AttentionSteps } from "./attention-and-transformers.figures";

const [RED, TEAL, , YELLOW, INDIGO] = CLUSTER_COLORS;

function Sentence({ label, words, hi, sub }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {words.map((w, i) => (
        <span key={i} className={l.chip} style={{ "--tc": i === hi ? YELLOW : "#ffffff30" }}>
          <b>{w}</b>
          {i === hi && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

function Box({ y, h = 30, text, color }) {
  return (
    <g>
      <rect x="50" y={y} width="180" height={h} rx="8" fill={color} fillOpacity=".22" stroke={color} />
      <text x="140" y={y + h / 2 + 4} textAnchor="middle" className={s.label}>{text}</text>
    </g>
  );
}

const Up = ({ y1, y2 }) => <line x1="140" y1={y1} x2="140" y2={y2} stroke="#cfd8e6" strokeWidth="1.5" markerEnd="url(#att-tip)" />;

function Plus({ cy }) {
  return (
    <g>
      <circle cx="140" cy={cy} r="10" fill="#0e1015" stroke="#cfd8e6" strokeWidth="1.5" />
      <path d={`M134 ${cy}h12M140 ${cy - 6}v12`} stroke="#fff" strokeWidth="1.5" />
    </g>
  );
}

function BlockDiagram() {
  const grey = "#9aa7ba";
  return (
    <svg viewBox="0 0 340 404" className={s.block} role="img"
      aria-label="Un bloque del transformer: la entrada pasa por una normalización y por la atención, y el resultado se vuelve a sumar a la entrada; luego pasa por una normalización y una red feed-forward, y ese resultado también se vuelve a sumar. El bloque se repite N veces.">
      <defs>
        <marker id="att-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#cfd8e6" />
        </marker>
      </defs>
      <rect x="20" y="42" width="300" height="310" rx="14" fill="none" stroke="#ffffff24" strokeDasharray="6 5" />
      <text x="34" y="62" style={{ fill: grey }}>bloque × N</text>

      <text x="140" y="20" textAnchor="middle" className={s.label}>vectores actualizados</text>
      <Up y1={52} y2={28} />
      <Plus cy={62} />
      <Box y={90} text="Feed-forward" color={TEAL} />
      <Up y1={90} y2={74} />
      <Box y={140} h={26} text="Normalizar" color={grey} />
      <Up y1={140} y2={122} />
      <Plus cy={200} />
      <Up y1={190} y2={168} />
      <Box y={228} text="Atención multicabeza" color={INDIGO} />
      <Up y1={228} y2={212} />
      <Box y={278} h={26} text="Normalizar" color={grey} />
      <Up y1={278} y2={262} />
      <Box y={366} text="vectores + posición" color={YELLOW} />
      <Up y1={366} y2={306} />

      <g fill="none" stroke={RED} strokeWidth="1.5" strokeDasharray="5 4">
        <path d="M140 326H290V200H153" markerEnd="url(#att-tip)" />
        <path d="M140 180H290V62H153" markerEnd="url(#att-tip)" />
      </g>
      <text x="300" y="245" style={{ fill: RED }} transform="rotate(90 300 245)">residual</text>
      <text x="300" y="95" style={{ fill: RED }} transform="rotate(90 300 95)">residual</text>
    </svg>
  );
}

export default function AttentionAndTransformers() {
  return (
    <>
      <p>
        Para cuando un modelo de lenguaje empieza a pensar en tu texto, cada token ya se cambió por una lista de números, su <strong>embedding</strong>
        (mira <ArticleLink slug="what-are-embeddings">¿Qué son los embeddings?</ArticleLink>). Pero ese primer vector sale de una tabla de búsqueda.
        Es el mismo cada vez que aparece el token, sin importar la frase que lo rodee. Este artículo explica la idea que resuelve eso, la <strong>atención</strong>,
        y cómo se empaqueta en el <strong>transformer</strong>, el diseño detrás de casi todos los modelos de lenguaje modernos.
      </p>

      <h2>Por qué importa el contexto</h2>
      <p>Mira la palabra “bank” en estas dos frases (“Nos sentamos en la orilla del río” y “Ella depositó efectivo en el banco”).</p>
      <Fig caption="El mismo token, dos significados. Solo las palabras de alrededor permiten distinguirlos.">
        <div className={s.contextRows}>
          <Sentence label="frase 1" words={["We", "sat", "on", "the", "river", "bank"]} hi={5} sub="orilla" />
          <Sentence label="frase 2" words={["She", "paid", "cash", "into", "the", "bank"]} hi={5} sub="dinero" />
        </div>
      </Fig>
      <p>
        Una tabla de búsqueda le da a “bank” un solo vector en las dos. Una persona lee “river” (río) y sabe al instante de qué “bank” se trata.
        Los pronombres dependen todavía más del contexto: en “The animal didn’t cross the street because it was too tired” (“El animal no cruzó la calle porque estaba demasiado cansado”), la palabra “it” no significa nada hasta que te das cuenta de que apunta hacia atrás, a “the animal”.
      </p>
      <p>
        Así que un modelo necesita una forma de que cada token <em>reúna información de otros tokens</em> y actualice su propio vector. Eso es exactamente lo que hace la atención.
      </p>

      <h2>La atención: cada token hace una pregunta</h2>
      <p>
        Esta es la intuición. Cada token se pregunta: “¿cuáles de los otros tokens me importan?”. Le da una puntuación a cada token que puede ver, convierte las puntuaciones en porcentajes
        y luego toma una mezcla de la información de esos tokens, poniendo más de los que tienen porcentajes más altos. Estos porcentajes se llaman <strong>pesos de atención</strong>.
      </p>
      <Fig caption="Pesos ilustrativos, escritos a mano para mostrar la idea; no salen de un modelo real. Pasa el cursor, toca o navega con tabulador a un token de la izquierda para ver cuánta atención le presta a cada token de la derecha. Los tokens que vienen después están ocultos, como en un generador de texto.">
        <AttentionLines />
      </Fig>
      <p>
        Con “it” seleccionado, la mayor parte del peso va a “animal”. Después de este paso, el vector de “it” lleva parte del significado de “animal”, que es lo que necesitan las partes posteriores del modelo.
        En un modelo real nadie escribe estos pesos a mano. Se calculan a partir de los propios vectores, usando números que el modelo aprendió durante el entrenamiento.
      </p>

      <h2>Consultas, claves y valores</h2>
      <p>
        ¿Cómo decide un token quién importa? Piensa en una búsqueda en una biblioteca. Escribes una <strong>consulta</strong> (query: lo que estás buscando). Cada libro tiene una <strong>clave</strong> (key), como la etiqueta en su lomo (de qué trata).
        Comparas tu consulta con cada etiqueta, y cuanto mejor coincide, más lees del contenido de ese libro, su <strong>valor</strong> (value).
      </p>
      <p>
        En un transformer, cada token cumple los tres papeles. Su vector se multiplica por tres matrices aprendidas distintas para producir tres vectores nuevos:
      </p>
      <ul>
        <li><strong>consulta</strong>: lo que este token está buscando;</li>
        <li><strong>clave</strong>: lo que este token ofrece, para que los demás lo encuentren;</li>
        <li><strong>valor</strong>: la información que entrega si alguien le presta atención.</li>
      </ul>
      <p>
        Luego, para el token que está mirando, la receta tiene cuatro pasos. <strong>Comparar</strong> su consulta con cada clave usando un <strong>producto punto</strong>: multiplicar los dos vectores número por número y sumar los resultados.
        Las direcciones parecidas dan un número grande. <strong>Escalar</strong> las puntuaciones dividiéndolas entre la raíz cuadrada de la longitud del vector. Aplicarles <strong>softmax</strong>: una función que convierte cualquier lista de números en números positivos que suman 1.
        Por último, <strong>mezclar</strong> los valores, cada uno multiplicado por su peso.
      </p>
      <Fig caption="Un ejemplo de juguete con vectores de 2 números para que se vea la aritmética. Los números son inventados, pero cada paso se calcula exactamente como lo calcula un transformer. Los modelos reales usan vectores de decenas a cientos de números por cabeza.">
        <AttentionSteps />
      </Fig>
      <p>
        Escrita de forma compacta, para todos los tokens a la vez, esta es la fórmula del artículo de 2017 que presentó el transformer: <code>softmax(QKᵀ / √d) · V</code>.
        Q, K y V son las consultas, claves y valores de todos los tokens apilados en tablas, y d es la longitud de un vector clave.
      </p>

      <h2>Máscara causal: prohibido espiar hacia adelante</h2>
      <p>
        Los generadores de texto como GPT escriben un token a la vez, de izquierda a derecha (<ArticleLink slug="next-token-prediction">Del último vector a la siguiente palabra</ArticleLink> explica ese ciclo).
        Durante el entrenamiento, el modelo aprende a predecir cada siguiente token de un texto. Si un token pudiera ver las palabras que vienen después, simplemente copiaría la respuesta.
      </p>
      <p>
        Por eso estos modelos usan una <strong>máscara causal</strong>: antes del softmax, las puntuaciones de todos los tokens posteriores se ponen en menos infinito, que softmax convierte en un peso de exactamente cero.
        Cada token puede mirarse a sí mismo y a todo lo anterior, nunca lo posterior. Dibujados como una cuadrícula, los pesos forman un triángulo.
      </p>
      <Fig caption="Los mismos pesos ilustrativos como cuadrícula. Cada fila es un token que mira; cada columna es un token al que se mira. Más brillante significa más peso. El triángulo superior rayado está enmascarado.">
        <AttentionMatrix />
      </Fig>
      <p>
        No todos los transformers son causales. Los modelos hechos para entender texto en lugar de escribirlo, como BERT, dejan que cada token vea toda la frase en las dos direcciones.
      </p>

      <h2>Muchas cabezas a la vez</h2>
      <p>
        Un solo conjunto de pesos solo puede expresar un tipo de relación a la vez. Pero a un token le pueden importar varias cosas: a qué sustantivo se refiere un pronombre, qué verbo va con un sujeto, cuál fue la palabra anterior.
      </p>
      <p>
        Así que un transformer corre varios cálculos de atención lado a lado, cada uno con sus propias matrices de consulta, clave y valor. Cada uno se llama <strong>cabeza</strong>.
        Sus salidas se unen y se vuelven a mezclar en un solo vector. El transformer original usaba 8 cabezas por capa; la versión más pequeña de GPT-2 usa 12.
      </p>
      <Callout title="Cómo se ve la atención real">
        La imagen ordenada de arriba, donde “it” apunta claramente a “animal”, es un boceto didáctico. Los investigadores que examinan modelos reales sí encuentran algunas cabezas con tareas legibles,
        como prestarle atención al token anterior. Pero muchas cabezas se ven desordenadas, algunas ponen casi todo su peso en el primer token como una especie de lugar de descanso, y el trabajo está repartido entre muchas cabezas y capas.
        Un patrón de atención muestra por dónde fluye la información, no una explicación completa de por qué el modelo respondió lo que respondió.
      </Callout>

      <h2>El bloque del transformer</h2>
      <p>
        La atención permite que los tokens compartan información. Un transformer la envuelve en un <strong>bloque</strong> con tres ingredientes más:
      </p>
      <ul>
        <li>
          <strong>Una red feed-forward.</strong> Después de que la atención mezcló información <em>entre</em> tokens, el vector de cada token pasa por su cuenta por una pequeña red neuronal:
          el vector se expande a uno más largo (cuatro veces más largo en el diseño original), pasa por una función no lineal sencilla y se vuelve a encoger. Se cree que aquí vive buena parte del conocimiento guardado del modelo.
        </li>
        <li>
          <strong>Conexiones residuales.</strong> En lugar de reemplazar el vector de un token, la salida de cada subcapa se le <em>suma</em>. El vector se vuelve un registro continuo que cada capa edita un poquito.
          Esto también hace que las pilas muy profundas sean mucho más fáciles de entrenar.
        </li>
        <li>
          <strong>Normalización.</strong> Antes de cada subcapa, el vector se reescala a un tamaño estándar para que los números no exploten ni se desvanezcan al pasar por muchas capas.
        </li>
      </ul>
      <Fig caption="Un bloque del transformer, leído de abajo hacia arriba, en el orden “normalizar primero” que usan la mayoría de los modelos al estilo GPT. Los caminos rojos punteados son conexiones residuales: la entrada rodea cada subcapa y se vuelve a sumar.">
        <BlockDiagram />
      </Fig>

      <h2>Apilar bloques</h2>
      <p>
        Un modelo son muchos de estos bloques apilados uno encima del otro, cada uno con sus propios números aprendidos. El transformer original tenía 6 en cada mitad; la versión más pequeña de GPT-2 tiene 12, y los modelos grandes tienen decenas más.
        Cada bloque lee los vectores que produjo el anterior y los refina. Las primeras capas suelen ocuparse de patrones locales y superficiales; las posteriores construyen rasgos más abstractos.
      </p>
      <p>
        La forma nunca cambia en el camino: entra un vector por token y sale un vector por token. Hasta arriba, el vector del último token se convierte en una predicción sobre el siguiente token.
      </p>

      <h2>¿Dónde está el orden de las palabras?</h2>
      <p>
        Hay una trampa. La atención por sí sola ignora el orden: compara cada token con todos los demás, así que “dog bites man” (“perro muerde a hombre”) y “man bites dog” (“hombre muerde a perro”) se verían iguales.
        Los transformers lo resuelven dándole a cada token <strong>información de posición</strong>. El artículo original le sumaba a cada embedding un patrón fijo de ondas senoidales, distinto para cada posición.
        GPT-2, en cambio, aprende un vector de posición. Muchos modelos más nuevos giran los vectores de consulta y clave en un ángulo que depende de la posición (un método llamado RoPE), para que las puntuaciones de atención reflejen qué tan lejos están dos tokens.
      </p>

      <Callout title="En una frase">
        Cada token construye una consulta, una clave y un valor; la atención compara las consultas con las claves para decidir cuánto mezclar de cada valor; un transformer repite eso, más una pequeña red por token, bloque tras bloque.
      </Callout>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.3blue1brown.com/lessons/attention", title: "Attention in transformers, step-by-step", source: "3Blue1Brown", note: "video, el mejor recorrido visual (en inglés)" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "video, el panorama general (en inglés)" },
  { href: "https://jalammar.github.io/illustrated-transformer/", title: "The Illustrated Transformer", source: "Jay Alammar", note: "en inglés" },
  { href: "https://arxiv.org/abs/1706.03762", title: "Attention Is All You Need", source: "Vaswani et al., 2017", note: "el artículo original (en inglés)" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Qué es la atención en un transformer?", a: "La atención permite que cada token mire a los demás tokens del texto y decida cuánto le importa cada uno. Cada token genera una consulta, una clave y un valor; su consulta se compara con todas las claves para obtener pesos, y su nuevo vector es una mezcla ponderada de los valores. Así es como el contexto cambia el significado de una palabra." },
  { q: "¿Qué son las consultas, las claves y los valores (query, key, value)?", a: "Son tres vectores que se calculan a partir del vector de cada token con pesos aprendidos. La consulta describe lo que el token está buscando, la clave describe lo que ofrece y el valor es la información que transmite. Las coincidencias entre consultas y claves deciden los pesos de atención, y esos pesos mezclan los valores." },
  { q: "¿Qué es la atención multicabeza?", a: "En lugar de correr la atención una sola vez, un transformer corre varias cabezas de atención lado a lado, cada una con sus propios pesos de consulta, clave y valor. Cada cabeza puede aprender a seguir relaciones distintas, como las palabras cercanas, la gramática o las referencias a un nombre anterior, y sus salidas se combinan." },
  { q: "¿Cómo sabe un transformer el orden de las palabras?", a: "La atención por sí sola trata la entrada como un conjunto sin orden, así que hay que agregar la posición. El transformer original sumaba a cada embedding un patrón fijo de ondas senoidales, GPT-2 aprende un vector de posición, y muchos modelos más nuevos usan embeddings de posición rotatorios (RoPE), que giran las consultas y las claves en un ángulo que depende de la posición." },
];
