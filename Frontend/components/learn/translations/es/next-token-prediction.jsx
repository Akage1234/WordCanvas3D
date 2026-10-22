import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig, ArticleLink, Callout } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/next-token-prediction.module.css";
import { SamplingPlayground } from "./next-token-prediction.figures";

const [RED, TEAL, , YELLOW, , PURPLE] = CLUSTER_COLORS;

// Decorative shapes for the pipeline figure (not real values).
const VECTOR = [0.6, -0.4, 0.9, -0.2, 0.3, -0.8, 0.5, 0.1, -0.6, 0.7, -0.3, 0.4];
const LOGITS = [0.3, 0.55, 0.2, 0.95, 0.4, 0.15, 0.6, 0.25, 0.45, 0.1, 0.35, 0.2];
const PROBS = [0.04, 0.1, 0.03, 0.75, 0.06, 0.02, 0.14, 0.03, 0.07, 0.02, 0.05, 0.03];

function Strip({ values, color }) {
  return (
    <span className={s.strip} aria-hidden="true">
      {values.map((v, i) => (
        <i key={i} style={{ height: `${Math.max(Math.abs(v) * 100, 6)}%`, "--c": v < 0 ? RED : color }} />
      ))}
    </span>
  );
}

function Pipeline() {
  const stages = [
    ["último vector", "768 números", <Strip key="v" values={VECTOR} color={TEAL} />],
    ["× unembedding", "matriz de 768 × 50,257", null],
    ["logits", "50,257 puntuaciones", <Strip key="l" values={LOGITS} color={YELLOW} />],
    ["softmax", "50,257 probabilidades", <Strip key="p" values={PROBS} color={PURPLE} />],
  ];
  return (
    <div className={s.pipe} role="img" aria-label="El vector del último token, de 768 números, se multiplica por una matriz de unembedding de 768 por 50,257, lo que da 50,257 logits, que softmax convierte en 50,257 probabilidades.">
      {stages.map(([title, sub, viz], i) => (
        <span key={title} style={{ display: "contents" }}>
          {i > 0 && <span className={s.arrow} />}
          <span className={s.stage}>
            <strong>{title}</strong>
            {viz}
            <span>{sub}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

const TEMPS = [
  ["0.5", ["86.4%", "11.7%", "1.9%"]],
  ["1", ["65.9%", "24.2%", "9.9%"]],
  ["2", ["50.2%", "30.4%", "19.4%"]],
];

function Row({ label, words, next, stop }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {words.map((w, i) => (
        <span key={i} className={l.chip} style={{ "--tc": "#ffffff30" }}><b>{w}</b></span>
      ))}
      <span className={l.chip} style={{ "--tc": stop ? RED : PURPLE }}><b>{next}</b></span>
      {stop && <span className={s.stop}>fin</span>}
    </div>
  );
}

export default function NextTokenPrediction() {
  return (
    <>
      <p>
        Un modelo de lenguaje lee tu texto como tokens, convierte cada uno en un vector y pasa esos vectores por una pila de bloques del transformer
        (<ArticleLink slug="attention-and-transformers">La atención y el transformer</ArticleLink> explica esa parte). Al final, cada token tiene un vector refinado.
        Pero se supone que el modelo debe <em>escribir</em> algo. Este artículo sigue el último paso: de una lista de números a una siguiente palabra de verdad, y luego la siguiente, y la siguiente.
      </p>

      <h2>Un vector, una pregunta</h2>
      <p>
        Para predecir lo que viene, el modelo solo necesita el vector final del <strong>último</strong> token. Gracias a la atención, ese vector ya reunió lo que necesita de todo lo anterior.
        En la versión más pequeña de GPT-2 tiene 768 números.
      </p>
      <p>
        El vocabulario del modelo, la lista fija de tokens que conoce (mira <ArticleLink slug="why-tokens">Por qué los modelos leen tokens</ArticleLink>), tiene 50,257 entradas en GPT-2.
        Ahora el trabajo es darle a cada una de esas entradas una puntuación de “¿qué tan bien encajaría como lo siguiente?”.
      </p>

      <h2>Del vector a las puntuaciones: el unembedding</h2>
      <p>
        La puntuación es una sola multiplicación. El modelo tiene una gran tabla aprendida llamada <strong>matriz de unembedding</strong> (o capa de salida), con una columna de 768 números por cada token del vocabulario.
        Multiplicar el último vector por esta matriz es lo mismo que calcular un <strong>producto punto</strong> con cada columna: multiplicar número por número y sumar.
        Una columna que apunta en una dirección parecida a la del vector obtiene una puntuación alta.
      </p>
      <p>
        El resultado es un número por token, 50,257 en total. Estas puntuaciones en bruto se llaman <strong>logits</strong>. Pueden ser de cualquier tamaño y pueden ser negativas; solo importan sus diferencias.
        En GPT-2, la matriz de unembedding es la misma tabla que la tabla de embeddings del primer paso, reutilizada (un truco llamado weight tying, o pesos compartidos). Muchos modelos más nuevos tienen dos tablas separadas.
      </p>
      <Fig caption="El último paso de un modelo del tamaño de GPT-2. Las formas de las barras son decorativas; los tamaños (768 y 50,257) son los de GPT-2 small. Solo la matriz de unembedding contiene 768 × 50,257 ≈ 38.6 millones de números.">
        <Pipeline />
      </Fig>

      <h2>De las puntuaciones a las probabilidades: softmax</h2>
      <p>
        Los logits son difíciles de usar directamente. Lo que queremos es una <strong>probabilidad</strong> para cada token: un número entre 0 y 1, y que todos sumen 1.
        La función que hace esto es <strong>softmax</strong>. Para cada logit calcula <code>e</code> elevado a ese logit (lo que vuelve positivo cada número y estira las diferencias) y luego lo divide entre el total.
      </p>
      <p>
        Por ejemplo, unos logits de 2.0, 1.0 y 0.1 se convierten en probabilidades de alrededor de 65.9%, 24.2% y 9.9%. El logit más grande se lleva la mayor parte, pero todos conservan una porción.
        Esta lista de probabilidades es la verdadera salida del modelo: no una palabra, sino una <strong>distribución de probabilidad</strong> sobre todas las palabras que podría decir a continuación.
      </p>

      <h2>Elegir una palabra: la decodificación</h2>
      <p>
        Convertir esa distribución en un solo token se llama <strong>decodificación</strong>, y hay varias maneras de hacerlo. Pruébalas abajo. Las palabras candidatas y sus logits son inventados para ilustrar,
        y para que todo se lea fácil hacemos como si el vocabulario tuviera solo estas 12 palabras. Las matemáticas que se les aplican son las reales.
      </p>
      <Fig caption="Logits ilustrativos para la palabra que sigue a “The cat sat on the” (“El gato se sentó en la”). Mover un control deslizante recalcula las probabilidades con exactitud: primero la temperatura, luego top-k, luego top-p, y después las palabras que quedan se reescalan para sumar 100%. Las palabras descartadas aparecen tachadas. “Sacar una palabra” elige una palabra al azar usando las probabilidades que se muestran.">
        <SamplingPlayground />
      </Fig>
      <p>Esto es lo que hace cada control.</p>
      <ul>
        <li>
          La <strong>decodificación voraz</strong> siempre toma el token más probable. Pon la temperatura en 0 para verlo: “mat” recibe 100% y todos los sorteos dan lo mismo.
          La decodificación voraz es predecible, pero en textos largos tiende a producir una escritura sosa y repetitiva.
        </li>
        <li>
          La <strong>temperatura</strong> divide cada logit entre un número T antes del softmax. Por debajo de 1, las diferencias crecen, así que la favorita se queda con todavía más probabilidad.
          Por encima de 1, las diferencias se achican y las palabras improbables tienen una oportunidad real. Nunca cambia el <em>orden</em> de las palabras, solo qué tan concentrada está la probabilidad.
        </li>
        <li>
          <strong>Top-k</strong> se queda solo con los k tokens más probables y descarta el resto. Así el modelo nunca elige algo muy improbable de la larga cola de un vocabulario grande.
          Su punto débil es que k es fijo: a veces solo tienen sentido dos palabras, y a veces cientos.
        </li>
        <li>
          <strong>Top-p</strong>, también llamado <strong>muestreo de núcleo</strong> (nucleus sampling), se queda con el grupo más pequeño de tokens principales cuyas probabilidades suman al menos p. Cuando el modelo está seguro, ese grupo es diminuto;
          cuando encajan muchas palabras, crece. Pon top-p en 0.50 arriba y solo sobreviven “mat” y “floor”, porque “mat” por sí sola tiene 41.3%, apenas por debajo de la mitad.
        </li>
      </ul>
      <Fig caption="Los mismos logits (2.0, 1.0, 0.1) pasados por softmax a tres temperaturas. Una temperatura más baja hace la distribución más marcada; una más alta la aplana.">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>Temperatura</th><th>logit 2.0</th><th>logit 1.0</th><th>logit 0.1</th></tr></thead>
            <tbody>
              {TEMPS.map(([t, ps]) => <tr key={t}><td>T = {t}</td>{ps.map((p) => <td key={p}>{p}</td>)}</tr>)}
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Por qué la misma pregunta recibe respuestas distintas</h2>
      <p>
        A menos que la decodificación sea voraz, el modelo hace un sorteo al azar en cada token. Una palabra con 25% saldrá más o menos una de cada cuatro veces.
        En cuanto sale una palabra distinta, todo lo que sigue se predice a partir de un texto distinto, así que las pequeñas diferencias del principio crecen hasta dar respuestas completamente distintas.
        Por eso hacerle la misma pregunta dos veces a un chatbot puede dar dos respuestas distintas, y por eso existen ajustes como la temperatura: te permiten cambiar variedad por previsibilidad.
      </p>
      <Callout title="Idea equivocada común">
        Una palabra poco probable no es una palabra “incorrecta”, y una muy probable no es un dato verificado. Las probabilidades describen qué texto suele venir después, según lo aprendido de los datos de entrenamiento.
        Un modelo puede estar muy seguro y aun así equivocarse.
      </Callout>

      <h2>El ciclo: agregar y repetir</h2>
      <p>
        Una pasada por el modelo produce un token. Para escribir una frase, el modelo agrega el token elegido al final de la entrada y vuelve a correr, prediciendo el token que sigue.
        Esto se llama generación <strong>autorregresiva</strong>: cada paso se alimenta de su propia salida anterior. También es la razón por la que las respuestas aparecen en pantalla palabra por palabra.
      </p>
      <Fig caption="Una ejecución ilustrativa del ciclo de generación. Cada paso agrega un token y vuelve a correr el modelo, hasta que elige el token de fin de texto.">
        <div className={s.loop}>
          <Row label="paso 1" words={["The", "cat", "sat", "on", "the"]} next="mat" />
          <Row label="paso 2" words={["The", "cat", "sat", "on", "the", "mat"]} next="." />
          <Row label="paso 3" words={["The", "cat", "sat", "on", "the", "mat", "."]} next="<|endoftext|>" stop />
        </div>
      </Fig>
      <p>La generación se detiene de una de dos maneras:</p>
      <ul>
        <li>
          <strong>Un token de fin de secuencia.</strong> El vocabulario contiene un token especial que significa “este texto terminó”. En GPT-2 es <code>&lt;|endoftext|&gt;</code>, ID 50256.
          Durante el entrenamiento, el modelo aprendió que los textos terminan con él, así que puede predecirlo como cualquier otro token. Cuando sale, la generación se detiene.
        </li>
        <li>
          <strong>Un límite de longitud.</strong> El programa que corre el modelo fija un número máximo de tokens nuevos. Si se llega primero a ese límite, el texto se corta, a veces a mitad de una frase.
        </li>
      </ul>
      <p>
        Los sistemas reales agregan mejoras, como reutilizar cálculos anteriores para que cada paso no empiece de cero, o buscar varias continuaciones candidatas a la vez (beam search, o búsqueda en haz).
        Pero el núcleo es exactamente esto: vector, logits, softmax, elegir uno, agregar, repetir.
      </p>
      <p>
        ¿Quieres ver los tokens con los que trabaja de verdad un modelo? El <Link href="/tokenizer">Tokenizador</Link> de este sitio divide cualquier texto en tokens de GPT y LLaMA con sus ID.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/blog/how-to-generate", title: "How to generate text: using different decoding methods", source: "blog de Hugging Face", note: "decodificación voraz, beam search, top-k y top-p con código (en inglés)" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "video, incluye unembedding, softmax y temperatura (en inglés)" },
  { href: "https://arxiv.org/abs/1904.09751", title: "The Curious Case of Neural Text Degeneration", source: "Holtzman et al., 2019", note: "el artículo que presentó el muestreo de núcleo (top-p) (en inglés)" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Qué son los logits en un modelo de lenguaje?", a: "Los logits son las puntuaciones en bruto que un modelo le da a cada token de su vocabulario para la siguiente posición. Salen de multiplicar el vector final por una matriz de unembedding. Más alto significa más probable, pero los logits solo se vuelven probabilidades después de que softmax los convierte en números entre 0 y 1 que suman 1." },
  { q: "¿Qué hace la temperatura en un LLM?", a: "La temperatura reescala los logits antes del softmax. Por debajo de 1, hace la distribución más marcada para que dominen los tokens principales y las respuestas sean más predecibles. Por encima de 1, la aplana, lo que da más oportunidad a los tokens improbables y hace la salida más variada pero más propensa a errores. Una temperatura de 0 equivale en la práctica a tomar siempre el token más probable." },
  { q: "¿Cuál es la diferencia entre el muestreo top-k y top-p?", a: "Top-k se queda solo con los k tokens más probables y hace el muestreo entre ellos. Top-p, también llamado muestreo de núcleo, se queda con el conjunto más pequeño de tokens cuyas probabilidades suman p, por ejemplo 0.9, así que el número de opciones crece cuando el modelo duda y se reduce cuando está seguro." },
  { q: "¿Un modelo de lenguaje planea toda su respuesta de antemano?", a: "No de forma explícita. Produce un token a la vez, y cada token nuevo se agrega a la entrada antes de predecir el siguiente. Su estado interno puede llevar información sobre hacia dónde va una frase, pero no hay un borrador terminado aparte que vaya leyendo en voz alta." },
];
