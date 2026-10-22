import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import h from "@/components/learn/articles/how-llms-work.module.css";
import { PipelineFigure } from "./how-llms-work.figures";

const [RED, TEAL] = CLUSTER_COLORS;

function Chips({ label, items }) {
  return (
    <div className={l.row}>
      {label && <span className={l.rowLabel}>{label}</span>}
      {items.map(([text, sub], i) => (
        <span key={i} className={l.chip} style={{ "--tc": CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
          <b>{text}</b>
          {sub !== undefined && <small>{sub}</small>}
        </span>
      ))}
    </div>
  );
}

// Illustrative numbers only: a fixed pseudo-random pattern per seed.
function vec(seed) {
  let x = seed % 233280;
  return Array.from({ length: 8 }, () => {
    x = (x * 9301 + 49297) % 233280;
    return (x / 233280) * 2 - 1;
  });
}

function Cells({ label, values, hit }) {
  return (
    <div className={`${h.trow} ${hit ? h.hit : ""}`}>
      <span>{label}</span>
      {values.map((v, i) => (
        <i key={i} style={{ background: `color-mix(in srgb, ${v >= 0 ? TEAL : RED} ${Math.round(Math.abs(v) * 80) + 12}%, transparent)` }} />
      ))}
    </div>
  );
}

const Gap = ({ children = "⋮" }) => <div className={h.gap}>{children}</div>;

const TABLE_ROWS = [[290, "·the"], [402, "·on"], [976, "The"], [9059, "·cat"], [10139, "·sat"]];

const PROBS = [["·mat", 0.38], ["·floor", 0.17], ["·bed", 0.08], ["·couch", 0.06], ["·rug", 0.04]];

export default function HowLlmsWork() {
  return (
    <>
      <p>
        Escribes <em>“The cat sat on the”</em> (“El gato se sentó en la”) y un chatbot sugiere <em>“mat”</em> (“alfombra”). Parece que el modelo leyó tu frase, lo pensó y respondió.
        Lo que pasa en realidad es una cadena fija de pasos sencillos que convierte el texto en números, hace cuentas con esos números
        y vuelve a convertir el resultado en texto. Este artículo recorre esa cadena una vez, de principio a fin, sin dar por hecho que sabes matemáticas.
      </p>
      <p>
        Un <strong>modelo de lenguaje</strong> es un programa entrenado para continuar texto. Un modelo de lenguaje <strong>grande</strong> (LLM) es la misma idea a una escala enorme:
        miles de millones de números ajustables, entrenados con una gran parte del texto que la gente ha escrito. Todo lo que sigue aplica a los modelos detrás de ChatGPT, Claude, Gemini o Llama.
      </p>
      <Callout title="En una frase">
        Un modelo de lenguaje corta tu texto en tokens, convierte cada token en una lista de números, deja que esas listas intercambien información a lo largo de muchas capas
        y luego puntúa cada posible siguiente token, elige uno, lo agrega al texto y repite.
      </Callout>

      <h2>Todo el proceso de un LLM, simplificado</h2>
      <figure className={h.wide}>
        <PipelineFigure />
        <figcaption>Una pasada para “The cat sat on the” → “ mat”, y luego una segunda pasada que agrega “.”. Los ID de token son reales (tokenizador o200k_base, el que usa GPT-4o). Los vectores, los pesos de atención, el número de capas, las puntuaciones y las probabilidades son ilustrativos, no salen de un modelo real.</figcaption>
      </figure>
      <p>El resto del artículo recorre esos pasos uno por uno.</p>

      <h2>1. El texto se convierte en tokens</h2>
      <p>
        Un modelo no puede trabajar directamente con letras, así que el primer paso es un <strong>tokenizador</strong>: un programa aparte que corta el texto en pedazos llamados <strong>tokens</strong>.
        Un token suele ser una palabra común completa, a veces un pedazo de palabra, un signo de puntuación o un espacio. Las palabras raras se arman con varios pedazos más pequeños.
      </p>
      <Fig caption="La misma palabra cortada de dos maneras por el tokenizador o200k_base. Al principio de un texto es rara, así que se arma con tres pedazos. Después de un espacio, como suele aparecer, es lo bastante común para ser un solo token. El punto marca el espacio.">
        <Chips label="“unbelievable” (“increíble”) al principio de un texto · 3 tokens" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="“ unbelievable” después de un espacio · 1 token" items={[["·unbelievable"]]} />
      </Fig>
      <p>
        Por qué pedazos, y no letras ni palabras completas, es otra historia: mira <ArticleLink slug="why-tokens">por qué los modelos leen tokens y no letras ni palabras</ArticleLink>,
        y <ArticleLink slug="tokenization-algorithms">cómo se construyen los tokenizadores</ArticleLink> para conocer el algoritmo que elige los pedazos.
      </p>

      <h2>2. Los tokens se convierten en números de ID</h2>
      <p>
        Cada tokenizador tiene un <strong>vocabulario</strong> fijo: una lista numerada de todos los pedazos que conoce. Para <code>o200k_base</code> esa lista tiene unas 200,000 entradas.
        Cada token se reemplaza por su número en la lista, su <strong>ID de token</strong>. Nuestra frase se convierte en <code>976 9059 10139 402 290</code>.
      </p>
      <p>
        Estos números son solo posiciones en una lista, como números de asiento. El token 9059 (<code>·cat</code>) no es “más grande” ni “más” que el token 402 (<code>·on</code>) en ningún sentido útil.
        El modelo necesita algo más rico con qué trabajar.
      </p>

      <h2>3. Los ID se convierten en vectores</h2>
      <p>
        Dentro del modelo hay una tabla enorme con una fila por cada entrada del vocabulario. Cada fila es un <strong>vector</strong>: una lista de números, normalmente de unos pocos miles en un modelo grande.
        Buscar la fila de un token te da su <strong>embedding</strong>. Nadie escribe estos números a mano. Empiezan siendo aleatorios y se ajustan durante el entrenamiento,
        hasta que los tokens que se usan de forma parecida terminan con filas parecidas.
      </p>
      <Fig caption="La tabla de embeddings como una búsqueda: cada ID de token selecciona una fila. Los colores representan números (verde azulado positivo, rojo negativo). Ilustrativo: solo se dibujan 8 de los miles de columnas, y los valores son inventados.">
        <div className={h.table} role="img" aria-label="Una tabla de embeddings: filas para los ID de token 290, 402, 976, 9059 y 10139, cada una con ocho celdas de colores. La fila 9059, ·cat, está resaltada.">
          <p className={h.sub}>fila = ID de token · columnas = números del vector</p>
          <Gap />
          {TABLE_ROWS.map(([id, t]) => (
            <div key={id}>
              <Cells label={`${id} ${t}`} values={vec(id)} hit={id === 9059} />
              <Gap />
            </div>
          ))}
          <Gap>unas 200,000 filas en total</Gap>
        </div>
      </Fig>
      <p>
        Esa idea, el significado como posición en un espacio de números, es el corazón de <ArticleLink slug="what-are-embeddings">qué son los embeddings</ArticleLink>,
        y <ArticleLink slug="latent-space">el espacio latente</ArticleLink> explora lo que pueden capturar las direcciones de ese espacio.
      </p>

      <h2>4. El transformer: los tokens se miran entre sí</h2>
      <p>
        En este punto cada vector describe a su token por sí solo. La palabra “bank” recibe el mismo vector inicial en “river bank” (“orilla del río”) y en “bank account” (“cuenta bancaria”).
        El cuerpo principal del modelo, el <strong>transformer</strong>, lo resuelve. Es una pila de <strong>capas</strong> de aspecto idéntico, decenas de ellas en un modelo grande.
      </p>
      <p>
        Cada capa hace dos cosas. Primero, <strong>atención</strong>: cada token mira hacia atrás a los tokens anteriores, decide cuáles le importan y mezcla información de ellos.
        Después, una pequeña red neuronal actualiza cada vector por separado. Tras muchas capas, cada vector describe a su token <em>en contexto</em>.
      </p>
      <Fig caption="El mismo token “·bank” entra a las capas con un vector idéntico en las dos frases. Después de que la atención mezcla las palabras de alrededor, los dos vectores son distintos. Valores ilustrativos.">
        <div className={l.pair} role="img" aria-label="Dos frases, river bank (orilla del río) y bank account (cuenta bancaria). Antes de las capas los dos vectores de bank son idénticos; después de las capas son distintos.">
          {[["I sat by the river bank", 11], ["I opened a bank account", 29]].map(([sentence, seed]) => (
            <div key={seed} className={h.table}>
              <h3>{sentence}</h3>
              <Cells label="·bank entra" values={vec(4101)} />
              <Cells label="·bank sale" values={vec(4101 * seed)} />
            </div>
          ))}
        </div>
      </Fig>
      <p>
        La atención es la idea que hizo que los modelos de lenguaje modernos funcionaran tan bien. Tiene una explicación completa, paso a paso, en <ArticleLink slug="attention-and-transformers">la atención y el transformer, explicados desde cero</ArticleLink>.
      </p>

      <h2>5. Solo la última posición predice</h2>
      <p>
        Después de la última capa sigue habiendo un vector por token. Para elegir el siguiente token, el modelo usa solo el vector de la <strong>última posición</strong>, el de <code>·the</code> en nuestro ejemplo.
        Como la atención le permitió reunir información de todos los tokens anteriores, ese único vector lleva ahora lo que el modelo dedujo sobre toda la frase.
      </p>

      <h2>6. Una puntuación para cada token: los logits</h2>
      <p>
        El último vector se compara con cada entrada del vocabulario, lo que produce una puntuación por token: unos 200,000 números.
        Estas puntuaciones en bruto se llaman <strong>logits</strong>. Un logit más alto significa que el modelo considera ese token una mejor continuación. Por sí solos, los logits son difíciles de leer:
        pueden ser negativos y no suman nada en particular.
      </p>

      <h2>7. Las puntuaciones se convierten en probabilidades: softmax</h2>
      <p>
        Una función llamada <strong>softmax</strong> convierte los logits en <strong>probabilidades</strong>. Hace que todos los valores sean positivos y los escala para que sumen 100%.
        Los logits más grandes se llevan una parte mucho mayor, porque softmax aplica la exponencial a cada puntuación: dos puntos más de logit significan unas 7 veces más probabilidad.
      </p>
      <Fig caption="Los logits y las probabilidades que softmax saca de ellos, para los cinco tokens más probables después de “The cat sat on the”. Números ilustrativos, elegidos para que sean coherentes entre sí; los ~200,000 tokens restantes se reparten el último 27%.">
        <div className={l.scroll}>
          <table className={l.table}>
            <thead><tr><th>siguiente token</th><th>logit</th><th>probabilidad</th></tr></thead>
            <tbody>
              {PROBS.map(([t, p]) => (
                <tr key={t}><td>{t}</td><td>{(Math.log(p) + 10).toFixed(1)}</td><td>{Math.round(p * 100)}%</td></tr>
              ))}
              <tr><td>todo lo demás</td><td>menor</td><td>27%</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>8. Elegir un token</h2>
      <p>
        Ahora el modelo tiene una probabilidad para cada token, y algo tiene que elegir. La regla más simple, la <strong>decodificación voraz</strong>, siempre toma el primero.
        La mayoría de los sistemas de chat, en cambio, hacen <strong>muestreo</strong>: sacan uno al azar, ponderado por las probabilidades, así que el mismo prompt puede dar respuestas distintas.
      </p>
      <p>
        Hay ajustes que moldean ese sorteo. El muestreo <strong>top-k</strong> se queda solo con los k tokens más probables y los reescala a 100% antes de sortear, así que los tokens muy improbables nunca pueden salir.
        La <strong>temperatura</strong> hace las probabilidades más marcadas o más planas. <ArticleLink slug="next-token-prediction">Del último vector a la siguiente palabra</ArticleLink> muestra cada uno con ejemplos interactivos.
      </p>

      <h2>9. Agregar y repetir</h2>
      <p>
        El token elegido, <code>·mat</code> (ID 2450), se agrega al final del texto. Luego <em>todo</em> el proceso vuelve a correr sobre el texto más largo para elegir el token siguiente,
        y otra vez después de ese. Una respuesta de 300 tokens son 300 pasadas. Este ciclo es la razón por la que las respuestas aparecen en pantalla palabra por palabra.
      </p>
      <Fig caption="Cada pasada lee todo lo que hay hasta ahora y agrega un token. El ciclo se detiene cuando el modelo produce un token especial de fin de texto o llega a un límite de longitud.">
        <div className={h.growth}>
          <Chips label="la pasada 1 lee 5 tokens → agrega ·mat" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"]]} />
          <Chips label="la pasada 2 lee 6 tokens → agrega ." items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"]]} />
          <Chips label="la pasada 3 lee 7 tokens → …" items={[["The"], ["·cat"], ["·sat"], ["·on"], ["·the"], ["·mat"], ["."]]} />
        </div>
      </Fig>
      <p>
        Los sistemas reales evitan rehacer todo el trabajo en cada pasada guardando resultados intermedios de los tokens que ya procesaron, pero la lógica es la misma:
        una pasada, un token nuevo.
      </p>

      <h2>De dónde salen los números</h2>
      <p>
        Cada número que usa el modelo, la tabla de embeddings, las capas de atención y la puntuación final, es un <strong>parámetro</strong> aprendido en el entrenamiento.
        El entrenamiento le muestra al modelo cantidades enormes de texto, le pide predecir cada siguiente token y ajusta un poquito todos los parámetros para que el token correcto sea un poco más probable.
        Repetidos a lo largo de billones de tokens, esos ajustes dan como resultado un modelo que continúa bien el texto. Los asistentes de chat reciben entrenamiento adicional con conversaciones para que sus continuaciones suenen a respuestas útiles.
      </p>

      <h2>Ideas equivocadas comunes</h2>
      <ul>
        <li>
          <strong>“Escribe toda la respuesta de una vez.”</strong> No. Predice un solo token, lo agrega y vuelve a correr.
          No tiene una respuesta terminada esperando; cada token se elige solo a partir del texto que hay hasta ese momento.
        </li>
        <li>
          <strong>“Busca la respuesta.”</strong> Adentro no hay ninguna base de datos de preguntas y respuestas. Solo está el conjunto fijo de parámetros aprendidos,
          y la respuesta se calcula de cero a partir de ellos cada vez. Por eso también un modelo puede afirmar algo falso con total seguridad: nada compara el resultado con una fuente.
        </li>
        <li>
          <strong>“Entiende como una persona.”</strong> Lo que tiene el modelo son patrones estadísticos aprendidos del texto, lo bastante ricos para capturar gramática, datos y algo de razonamiento.
          Si eso cuenta como entender está en debate. Lo que es seguro es que aprendió del texto, no de ver, tocar o vivir en el mundo.
        </li>
      </ul>

      <h2>A dónde seguir</h2>
      <p>
        Cada paso de arriba tiene su propio artículo: <ArticleLink slug="why-tokens">tokens</ArticleLink>, <ArticleLink slug="tokenization-algorithms">tokenizadores</ArticleLink>,{" "}
        <ArticleLink slug="what-are-embeddings">embeddings</ArticleLink>, <ArticleLink slug="latent-space">espacio latente</ArticleLink>,{" "}
        <ArticleLink slug="attention-and-transformers">atención</ArticleLink> y <ArticleLink slug="next-token-prediction">cómo se elige el siguiente token</ArticleLink>.
        En este sitio puedes dividir tu propio texto con el <Link href="/tokenizer">Tokenizador</Link> y explorar vectores de palabras en el <Link href="/embedding">explorador de Embeddings</Link>.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.youtube.com/watch?v=wjZofJX0v4M", title: "But what is a GPT? Visual intro to transformers", source: "3Blue1Brown, YouTube", note: "el mejor recorrido visual de todo este proceso (ahora se titula “Transformers, the tech behind LLMs”; en inglés)" },
  { href: "https://jalammar.github.io/illustrated-gpt2/", title: "The Illustrated GPT-2", source: "Jay Alammar", note: "el mismo proceso dibujado paso a paso, un nivel más a fondo (en inglés)" },
  { href: "https://bbycroft.net/llm", title: "LLM Visualization", source: "Brendan Bycroft", note: "un recorrido en 3D por cada número de un GPT real pequeño (en inglés)" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Cómo genera texto un modelo de lenguaje grande (LLM)?", a: "Divide tu texto en tokens, convierte cada ID de token en un vector y pasa esos vectores por un transformer. La salida en la última posición se convierte en una puntuación para cada token del vocabulario. Softmax convierte las puntuaciones en probabilidades, se elige un token, se agrega al texto y el ciclo se repite hasta terminar la respuesta." },
  { q: "¿ChatGPT entiende lo que dice?", a: "No lee ni piensa como las personas. Aprendió, a partir de cantidades enormes de texto, qué tokens suelen venir después de cuáles, y esos patrones capturan mucha gramática, datos y razonamiento. Si eso cuenta como entender está en debate, pero en lo mecánico cada respuesta se arma un token predicho a la vez." },
  { q: "¿Por qué una IA da respuestas distintas a la misma pregunta?", a: "En cada paso el modelo produce probabilidades, no una sola respuesta fija, y la mayoría de las apps de chat hacen muestreo a partir de esas probabilidades en lugar de tomar siempre el token más probable. Ajustes como la temperatura y top-p controlan cuánto azar se permite. Sin muestreo, el mismo modelo con el mismo prompt da la misma salida." },
  { q: "¿De dónde saca su conocimiento un modelo de lenguaje?", a: "Del entrenamiento. El modelo lee una colección muy grande de texto y ajusta miles de millones de números, sus parámetros, para predecir mejor el siguiente token. Los datos quedan guardados de forma implícita en esos números. No busca nada mientras responde, a menos que la app que lo rodea agregue un paso de búsqueda o recuperación." },
];
