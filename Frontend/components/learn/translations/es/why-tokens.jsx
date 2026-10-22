import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import l from "@/components/learn/learn.module.css";
import s from "@/components/learn/articles/why-tokens.module.css";
import { ThreeWaySplit } from "./why-tokens.figures";

const [RED, TEAL, , YELLOW] = CLUSTER_COLORS;

// Counts for the Austen sentence below: characters and words counted directly, tokens with o200k_base.
const LENGTHS = [["caracteres", 117, RED], ["palabras", 23, TEAL], ["tokens (o200k_base)", 26, YELLOW]];

function Chips({ label, items }) {
  return (
    <div className={l.row}>
      <span className={l.rowLabel}>{label}</span>
      {items.map((t, i) => {
        const [text, sub] = [].concat(t);
        return (
          <span key={i} className={l.chip} style={{ "--tc": text === "[UNK]" ? "#8a93a3" : CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
            <b>{text}</b>
            {sub && <small>{sub}</small>}
          </span>
        );
      })}
    </div>
  );
}

export default function WhyTokens() {
  return (
    <>
      <p>
        Un modelo de lenguaje es un programa que hace cuentas. No puede leer directamente las letras de tu pantalla.
        Antes de hacer cualquier cosa con tu texto, hay que picarlo en unidades pequeñas y cambiar cada unidad por un número.
        Esas unidades se llaman <strong>tokens</strong>, y el picado se llama <strong>tokenización</strong>.
      </p>
      <p>
        La pregunta obvia es: ¿qué debería ser una unidad? ¿Una sola letra? ¿Una palabra completa? Todos los modelos modernos responden “algo intermedio”, y este artículo explica por qué.
        Todo se reduce a un equilibrio entre cuántas unidades distintas permites y cuántas de ellas hacen falta para escribir una frase.
      </p>

      <h2>Dos números que tiran en sentidos opuestos</h2>
      <p>
        Elijas la unidad que elijas, el resultado se describe con dos números.
      </p>
      <ul>
        <li>
          El <strong>vocabulario</strong> es la lista fija de todas las unidades que conoce el modelo. Cada entrada recibe un ID, y el modelo aprende un conjunto de números aparte para cada entrada.
          Un vocabulario más grande significa más cosas que aprender y guardar.
        </li>
        <li>
          La <strong>longitud de secuencia</strong> es cuántas unidades hacen falta para escribir un texto concreto. Secuencias más largas significan más trabajo cada vez que el modelo lee o escribe.
        </li>
      </ul>
      <p>
        Las unidades pequeñas dan un vocabulario pequeño pero secuencias largas. Las unidades grandes dan secuencias cortas pero un vocabulario enorme. Pruébalo abajo: el mismo texto, cortado de tres maneras.
      </p>
      <Fig caption="Un texto dividido en caracteres, en palabras (donde haya un espacio) y en los tokens de subpalabra de o200k_base, el tokenizador que usa GPT-4o. Los ejemplos están precalculados; si escribes tu propio texto, se carga el tokenizador real en tu navegador. Un · marca un espacio, y las etiquetas del estilo <F0 9F> son bytes en bruto que son solo parte de un carácter.">
        <ThreeWaySplit />
      </Fig>
      <p>
        Mira algunos de los ejemplos. Los caracteres siempre dan la fila más larga. Las palabras dan la fila más corta en inglés, pero fallan con el japonés, que se escribe sin espacios,
        así que toda la frase se vuelve una sola “palabra”. La fila de subpalabras tiene una longitud parecida a la de palabras, y aun así funciona con todos los ejemplos.
      </p>

      <h2>Opción uno: caracteres</h2>
      <p>
        Usar un token por carácter tiene un atractivo real. El vocabulario es pequeño y nunca se queda corto: cualquier texto es solo una cadena de caracteres, así que el modelo nunca se puede topar con algo que no sepa escribir.
      </p>
      <p>
        El problema es la longitud. Un carácter por sí solo lleva muy poco significado. La letra <code>t</code> casi no le dice nada al modelo, así que tiene que gastar su esfuerzo en volver a pegar letras para formar palabras antes de pensar en lo que significan.
        Y cada texto se vuelve varias veces más largo de lo necesario.
      </p>
      <p>
        La longitud importa por dos razones concretas. Primero, el cómputo: en un <ArticleLink slug="attention-and-transformers">transformer</ArticleLink>, cada token mira a todos los demás tokens,
        así que esa parte del trabajo crece con el cuadrado de la longitud. Si duplicas la longitud, esa parte cuesta unas cuatro veces más.
        Segundo, la <strong>ventana de contexto</strong>, el número máximo de tokens que un modelo puede recibir a la vez, es un presupuesto fijo. Si cada token contiene menos texto, cabe menos de tu documento.
      </p>
      <Fig caption="La misma frase (la primera línea de Orgullo y prejuicio, en inglés) medida de tres maneras. El conteo de caracteres y de palabras es exacto; el de tokens sale del tokenizador o200k_base.">
        <p className={s.quote}>“It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.”</p>
        <dl className={s.bars}>
          {LENGTHS.map(([name, n, c]) => (
            <div key={name} style={{ display: "contents" }}>
              <dt>{name}</dt>
              <dd style={{ "--tc": c }}><i style={{ "--w": `${(n / 117) * 85}%` }} />{n}</dd>
            </div>
          ))}
        </dl>
      </Fig>

      <h2>Opción dos: palabras completas</h2>
      <p>
        Las palabras completas resuelven el problema de la longitud: en inglés, el número de tokens se acerca al número de palabras. Además, cada unidad significa algo. Pero aparecen tres problemas.
      </p>
      <ul>
        <li>
          <strong>El vocabulario se dispara.</strong> Solo el inglés tiene cientos de miles de formas de palabras si cuentas plurales, tiempos verbales y compuestos (<code>run</code>, <code>runs</code>, <code>running</code>, <code>rerun</code>…).
          Agrega nombres, números, errores de dedo, hashtags, código y otros idiomas, y ninguna lista está nunca completa.
        </li>
        <li>
          <strong>Palabras desconocidas.</strong> Todo lo que falte en la lista se tiene que reemplazar por un único token comodín, que suele escribirse <code>[UNK]</code>.
          Para el modelo, todas las palabras desconocidas se ven idénticas, así que su significado simplemente se pierde.
        </li>
        <li>
          <strong>No todos los idiomas usan espacios.</strong> El chino, el japonés y el tailandés no ponen espacios entre palabras, así que “dividir en los espacios” ni siquiera define qué es una palabra.
        </li>
      </ul>
      <p>
        Las palabras raras causan además un problema más discreto. Una palabra que aparece apenas unas cuantas veces en el texto de entrenamiento recibe su propia entrada en el vocabulario, pero el modelo ve muy pocos ejemplos para aprender mucho sobre ella.
      </p>
      <Fig caption="Fila de arriba (ilustrativa): lo que haría un tokenizador por palabras entrenado solo con texto en inglés con una frase en alemán y un emoji. Todo lo que nunca vio se convierte en el mismo token [UNK]. Fila de abajo (real): los tokens de subpalabra de o200k_base para el mismo texto; no se pierde nada.">
        <Chips label="por palabras, vocabulario solo en inglés (ilustrativo)" items={[["[UNK]", "Grüße"], ["[UNK]", "aus"], ["[UNK]", "München!"], ["[UNK]", "🦒"]]} />
        <Chips label="tokens de subpalabra, o200k_base (real)" items={["Gr", "ü", "ße", "·aus", "·München", "!", "·<F0 9F>", "<A6>", "<92>"]} />
      </Fig>

      <h2>El punto medio: pedazos de subpalabra</h2>
      <p>
        La tokenización por subpalabras toma la mitad útil de cada opción. Las palabras comunes, y las palabras comunes con un espacio delante, reciben un token propio, así que el inglés de todos los días se mantiene corto.
        Las palabras raras se deletrean con unos pocos pedazos más pequeños que a su vez son comunes: en el ejemplo de arriba, <code>Tokenizers</code> se convierte en <code>Token</code> + <code>izers</code>.
        Los pedazos se pueden reutilizar, así que el modelo aprende lo que suele significar <code>izers</code> a partir de muchas palabras distintas.
      </p>
      <p>
        El vocabulario se queda en un tamaño que un modelo puede costear. El tokenizador de GPT-2 tiene unas 50,000 entradas, el tokenizador <code>cl100k_base</code> que usa GPT-4 tiene unas 100,000, y <code>o200k_base</code> tiene unas 200,000.
        Suena a mucho, pero es fijo y finito, a diferencia de una lista con todas las palabras.
      </p>
      <Callout title="En una frase">
        Los tokens de subpalabra mantienen las secuencias casi tan cortas como las palabras, sin toparse nunca con una palabra que no puedan escribir.
      </Callout>
      <p>
        Qué pedazos entran en la lista no lo decide un lingüista. El tokenizador los aprende de una gran muestra de texto, quedándose con los fragmentos que aparecen más seguido.
        Por eso los tokens rara vez coinciden con las sílabas o los prefijos del diccionario. Cómo funciona ese aprendizaje es el tema de <ArticleLink slug="tokenization-algorithms">Cómo se construyen los tokenizadores</ArticleLink>.
      </p>

      <h2>Los bytes: la red de seguridad</h2>
      <p>
        Queda una pregunta: ¿y si faltan incluso los pedazos más pequeños? Unicode, el estándar que cubre los sistemas de escritura del mundo y los emoji, tiene mucho más de 100,000 caracteres.
        Meterlos todos en el vocabulario desperdiciaría espacio en caracteres que casi nunca aparecen.
      </p>
      <p>
        El truco de los tokenizadores al estilo GPT es trabajar con <strong>bytes</strong>. Las computadoras guardan el texto como bytes usando una codificación llamada UTF-8: una letra simple del inglés ocupa un byte,
        una letra con acento como <code>ü</code> ocupa dos, y la mayoría de los emoji ocupan cuatro. Solo hay 256 valores posibles de byte, así que si los 256 están en el vocabulario, se puede escribir cualquier texto, un byte a la vez si hace falta.
      </p>
      <p>
        Lo puedes ver en el ejemplo en alemán. El emoji de jirafa 🦒 es raro, así que no hay un token único para él. En su lugar se divide en sus bytes en bruto: un token para un espacio más los dos primeros bytes <code>F0 9F</code>,
        luego <code>A6</code> y luego <code>92</code>. Ninguno de esos pedazos es un carácter por sí solo, pero juntos reconstruyen el emoji exactamente.
        Nada es desconocido nunca; las cosas raras solo cuestan más tokens. (<ArticleLink slug="why-emoji-cost-more-tokens">Por qué los emoji y algunos idiomas cuestan más tokens</ArticleLink> lo analiza en detalle).
      </p>
      <p>
        Algunos tokenizadores, como el tokenizador SentencePiece que usaban los modelos LLaMA originales, trabajan primero con caracteres y solo bajan a bytes para los caracteres que nunca vieron. El efecto es el mismo: ningún texto queda sin poder representarse.
      </p>

      <h2>Qué significa esto en la práctica</h2>
      <ul>
        <li><strong>Los límites y los precios van en tokens.</strong> Las ventanas de contexto y la mayoría de los precios de las API cuentan tokens, no palabras. Una regla práctica común para el inglés es que un token equivale a unas tres cuartas partes de una palabra, pero varía mucho según el idioma y el contenido.</li>
        <li><strong>El mismo texto puede costar distinto.</strong> Cada modelo usa su propio tokenizador, así que la misma frase puede ser un número distinto de tokens en cada uno.</li>
        <li><strong>El modelo no ve letras.</strong> <code>·unbelievably</code> es un solo token con un solo ID. El modelo nunca ve directamente las letras que tiene adentro, y esa es parte de la razón por la que las preguntas de ortografía o de contar letras pueden confundir a los modelos.</li>
      </ul>
      <p>
        Una vez que el texto es una lista de ID de token, el siguiente paso dentro de un modelo es convertir cada ID en una lista de números con significado. Esa es la idea detrás de los <ArticleLink slug="what-are-embeddings">embeddings</ArticleLink>,
        y <ArticleLink slug="how-llms-work">Cómo un modelo de lenguaje convierte tus palabras en una respuesta</ArticleLink> muestra dónde encajan ambos pasos en el proceso completo.
        Para dividir tu propio texto con varios tokenizadores reales lado a lado, prueba el <Link href="/tokenizer">Tokenizador</Link>.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM Course", note: "el capítulo 6 trata los tokenizadores a fondo (en inglés)" },
  { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · video", note: "en inglés" },
  { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia", note: "en inglés" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Qué es un token en la inteligencia artificial?", a: "Un token es un pedazo pequeño de texto que un modelo de lenguaje trata como una sola unidad: una palabra común completa, parte de una palabra más rara, un signo de puntuación o un solo byte. Cada token tiene un número de ID en el vocabulario del modelo, y el modelo solo trabaja con esos números, nunca directamente con letras." },
  { q: "¿Cuántas palabras son 1,000 tokens?", a: "Para un texto normal en inglés, unas 750 palabras: una regla práctica común es que un token equivale a unas tres cuartas partes de una palabra. La proporción cambia según el tokenizador, el idioma y el contenido. El código, los números, los emoji y los idiomas distintos del inglés suelen necesitar más tokens por palabra." },
  { q: "¿Por qué los modelos de lenguaje no usan palabras completas como tokens?", a: "Una lista de palabras nunca puede estar completa. Los nombres, los errores de dedo, las palabras nuevas, el código y otros idiomas se convertirían en un único token desconocido y perderían su significado, y en idiomas como el chino y el japonés no se ponen espacios entre palabras. Los tokens de subpalabra mantienen enteras las palabras comunes y deletrean las raras con pedazos más pequeños y reutilizables." },
  { q: "¿Por qué a la IA le cuesta contar las letras de una palabra?", a: "El modelo ve ID de token, no letras. Una palabra como “strawberry” (“fresa”) puede ser uno o dos tokens, cada uno un solo número, así que las letras individuales no se ven directamente. El modelo tiene que haber aprendido cómo se deletrea cada token a partir de su texto de entrenamiento, y por eso las tareas de contar letras y de ortografía fallan más de lo que uno esperaría." },
];
