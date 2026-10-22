import { Link } from "@/i18n/navigation";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import s from "@/components/learn/articles/tokenization-algorithms.module.css";
import { BpeApply, BpeTrainer } from "./tokenization-algorithms.figures";

// Computed from the toy corpus low×5, lower×2, newest×6, widest×3.
// WordPiece score = pair count / (count of first part × count of second part), with ## on word-internal pieces.
const SCORES = [
  ["e + s", 9, "9 / (17 × 9)", "0.059"],
  ["s + t", 9, "9 / (9 × 9)", "0.111"],
  ["w + e", 8, "8 / (13 × 17)", "0.036"],
  ["l + o", 7, "7 / (7 × 7)", "0.143"],
  ["w + i", 3, "3 / (3 × 3)", "0.333"],
];

export default function TokenizationAlgorithms() {
  return (
    <>
      <p>
        En <ArticleLink slug="why-tokens">Por qué los modelos leen tokens</ArticleLink> vimos que los modelos de lenguaje modernos leen el texto en pedazos de <strong>subpalabra</strong>:
        las palabras comunes se quedan enteras y las raras se arman con partes más pequeñas. Pero ¿quién decide que <code>lowest</code> (“el más bajo”) debe convertirse en <code>low</code> + <code>est</code>?
      </p>
      <p>
        Nadie, a mano. Un tokenizador <em>aprende</em> su vocabulario de una gran muestra de texto, llamada <strong>corpus de entrenamiento</strong>, antes de que se entrene el propio modelo de lenguaje.
        Este artículo recorre las tres recetas que usan casi todos los modelos: <strong>byte-pair encoding</strong> (BPE), <strong>WordPiece</strong> y <strong>Unigram</strong>.
      </p>

      <h2>Byte-pair encoding: fusionar el par más común</h2>
      <p>
        BPE nació en 1994 como un truco de compresión de datos de Philip Gage. En 2016, Rico Sennrich y sus colegas lo adaptaron para dividir palabras en traducción automática, y de ahí se extendió.
        La idea cabe en una frase: <strong>empieza con caracteres sueltos y sigue pegando el par de vecinos que aparece más seguido.</strong>
      </p>
      <p>Con más detalle, el entrenamiento repite tres pasos.</p>
      <ul>
        <li><strong>Contar pares.</strong> Mira cada palabra del corpus, dividida en sus pedazos actuales, y cuenta cuántas veces aparece cada par de pedazos vecinos.</li>
        <li><strong>Fusionar al ganador.</strong> Toma el par más frecuente, por ejemplo <code>e</code> + <code>s</code>, agrega el pedazo unido <code>es</code> al vocabulario y reemplaza ese par en todo el corpus.</li>
        <li><strong>Repetir</strong> hasta que el vocabulario llegue al tamaño que elegiste de antemano.</li>
      </ul>
      <p>
        El resultado son dos cosas: el <strong>vocabulario</strong> (todos los pedazos que conoce el tokenizador) y la <strong>lista de fusiones</strong> (las fusiones, en el orden en que se aprendieron). Recórrelo paso a paso con un corpus diminuto de cuatro palabras.
      </p>
      <Fig caption="Entrenamiento de BPE con un corpus de juguete de cuatro palabras, donde “low” aparece 5 veces, “lower” 2, “newest” 6 y “widest” 3 (el ejemplo de Sennrich et al.). Cada paso cuenta los pares vecinos, ponderados por cuántas veces aparece la palabra, y fusiona el más frecuente (resaltado). Los empates se los lleva el par que se vio primero. Todos los números se calculan en vivo a partir del corpus.">
        <BpeTrainer />
      </Fig>
      <p>
        Fíjate en lo que descubren las fusiones. Las dos primeras arman <code>est</code>, porque aparece tanto en <code>newest</code> como en <code>widest</code>.
        Luego aparece <code>low</code>, después <code>new</code>, y para la fusión 7 la palabra frecuente <code>newest</code> ya es un solo token. La más rara, <code>lower</code>, sigue siendo <code>low</code> + <code>e</code> + <code>r</code>.
        Ese es justo el comportamiento que queremos: las cadenas frecuentes se vuelven tokens enteros y las raras se quedan en partes reutilizables.
      </p>
      <p>
        Un tokenizador real hace lo mismo con gigabytes de texto y se detiene tras decenas de miles de fusiones.
        En el tokenizador real de GPT-2, las primeras fusiones que se aprendieron fueron un espacio seguido de <code>t</code>, un espacio seguido de <code>a</code>, y luego <code>he</code>, <code>in</code>, <code>re</code> y <code>on</code>: los pares de letras más comunes del inglés.
      </p>

      <h2>Usar las fusiones con texto nuevo</h2>
      <p>
        Una vez terminado el entrenamiento, el corpus se descarta. Para tokenizar una palabra nueva, el tokenizador la divide en caracteres y vuelve a aplicar la lista de fusiones <em>en el orden en que se aprendió</em>, aplicando cada fusión donde encaje.
        Lo que queda al final es la lista de tokens.
      </p>
      <Fig caption="Las 10 fusiones aprendidas arriba aplicadas a palabras nuevas (vocabulario de juguete ilustrativo). “lowest” nunca apareció en el corpus, y aun así sale como low + est. Da la casualidad de que el tokenizador real de GPT-2 divide igual “lowest” escrito sin espacio delante.">
        <BpeApply />
      </Fig>
      <p>
        Por eso los tokenizadores de subpalabra nunca se topan con una palabra totalmente desconocida: en el peor de los casos, como <code>rider</code> aquí, una palabra simplemente se queda en caracteres sueltos.
        Hay una trampa. Nuestro vocabulario de juguete solo tiene las diez letras que aparecieron en el corpus, así que una palabra con una <code>k</code> no se podría escribir de ninguna manera. Los tokenizadores reales lo resuelven con bytes, a lo que volveremos más adelante.
      </p>

      <h2>WordPiece: fusionar el par más sorprendente</h2>
      <p>
        WordPiece se desarrolló en Google y se conoce sobre todo como el tokenizador de <strong>BERT</strong> y de muchos modelos al estilo BERT, como DistilBERT.
        Su ciclo de entrenamiento se parece al de BPE: empieza con caracteres, fusiona pares, repite. La diferencia está en <em>qué</em> par fusiona.
      </p>
      <p>
        BPE elige el par que aparece más seguido. WordPiece divide ese conteo entre cuántas veces aparece cada parte por su lado:
      </p>
      <p style={{ textAlign: "center" }}>
        <code>score = count(pair) / (count(first) × count(second))</code>
      </p>
      <p>
        Un par obtiene una puntuación alta cuando sus dos partes casi siempre aparecen <em>juntas</em>. Los pedazos muy comunes, como la letra <code>e</code>, salen penalizados, porque verlos junto a algo no tiene nada de sorprendente.
        (Formalmente, WordPiece elige la fusión que más aumenta la verosimilitud de los datos de entrenamiento. Google nunca publicó su código de entrenamiento, y esta proporción es la forma en que lo deciden las implementaciones abiertas como la de Hugging Face).
      </p>
      <Fig caption="La primera fusión con el mismo corpus de juguete. BPE fusiona e + s porque es el par más frecuente. WordPiece prefiere w + i: solo aparece 3 veces, pero w e i nunca aparecen por separado. Los conteos se calculan a partir del corpus; en WordPiece, los pedazos dentro de una palabra llevan el prefijo ##, así que la w de “low” y la w al principio de “widest” se cuentan por separado.">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col">par</th><th scope="col">BPE: conteo</th><th scope="col">conteo ÷ (primero × segundo)</th><th scope="col">puntuación WordPiece</th></tr>
            </thead>
            <tbody>
              {SCORES.map(([pair, n, calc, score]) => (
                <tr key={pair}>
                  <td>{pair}</td>
                  <td className={pair === "e + s" ? s.win : undefined}>{n}</td>
                  <td>{calc}</td>
                  <td className={pair === "w + i" ? s.win : undefined}>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fig>
      <p>
        WordPiece además escribe sus tokens de otra forma. Un pedazo que continúa una palabra empieza con <code>##</code>, así que una palabra como <code>hugs</code> (“abrazos”) podría dividirse en <code>hug</code> + <code>##s</code>.
        Así los límites entre palabras se ven en los propios tokens.
        Y al tokenizar texto nuevo, WordPiece no vuelve a aplicar fusiones. Recorre cada palabra desde la izquierda y toma una y otra vez el <strong>pedazo más largo de su vocabulario</strong> que coincida. Si alguna parte no coincide con nada, toda la palabra se convierte en <code>[UNK]</code>.
      </p>

      <h2>Unigram: empezar en grande y podar</h2>
      <p>
        El método Unigram, presentado por Taku Kudo en 2018, va en la dirección contraria. En lugar de hacer crecer un vocabulario a partir de caracteres, empieza con un vocabulario muy <em>grande</em>, por ejemplo muchas de las subcadenas comunes del corpus, y lo va reduciendo.
      </p>
      <ul>
        <li>Cada pedazo del vocabulario recibe una probabilidad, estimada a partir del corpus.</li>
        <li>Una palabra casi siempre se puede dividir de muchas maneras (<code>low</code>+<code>est</code>, <code>lo</code>+<code>west</code>, <code>l</code>+<code>owest</code>…). El tokenizador elige la división cuyos pedazos tienen la mayor probabilidad combinada.</li>
        <li>En cada ronda de entrenamiento, calcula cuánto empeoraría el ajuste al corpus si se quitara cada pedazo, y borra los que menos importan, normalmente entre un 10 y un 20% de ellos. Los caracteres sueltos se conservan siempre, para que cualquier palabra se pueda seguir escribiendo.</li>
        <li>Esto se repite hasta que el vocabulario tiene el tamaño buscado.</li>
      </ul>
      <p>
        Como Unigram es un modelo de probabilidad, también puede hacer <em>muestreo</em> de distintas divisiones de la misma palabra durante el entrenamiento, un truco llamado regularización de subpalabras que hace a los modelos más resistentes a las grafías poco comunes.
      </p>
      <p>
        Unigram se usa casi siempre a través de <strong>SentencePiece</strong>, una biblioteca de Google que entrena directamente con texto en bruto y trata el espacio como un símbolo más (escrito <code>▁</code>), así que funciona igual en idiomas con espacios o sin ellos.
        SentencePiece implementa tanto Unigram como BPE. T5, ALBERT y XLNet usan Unigram; los modelos LLaMA originales usaban el modo BPE de SentencePiece.
      </p>

      <h2>BPE a nivel de bytes: nada es desconocido</h2>
      <p>
        Volvamos a la trampa de antes: un vocabulario basado en caracteres no puede escribir un carácter que nunca vio. El <strong>BPE a nivel de bytes</strong>, que llegó con GPT-2 en 2019, lo resuelve aplicando BPE a los <strong>bytes</strong> del texto (su codificación UTF-8) en lugar de a los caracteres.
        Solo hay 256 bytes posibles, y todos están en el vocabulario desde el principio, así que cualquier cadena, en cualquier idioma y con emoji incluidos, se puede tokenizar. No existe el token <code>[UNK]</code>.
      </p>
      <p>
        Dos detalles más hacen que funcione en la práctica. Primero, el texto se <strong>pretokeniza</strong>: un patrón lo divide en trozos aproximados (palabras con su espacio delante, números, puntuación) antes de que corra BPE, así que las fusiones nunca pegan el final de una palabra con el principio de la siguiente.
        Segundo, el espacio se guarda como parte de la palabra que sigue, y por eso los tokens al estilo GPT se ven como <code>·the</code>. Los tokenizadores de GPT-2, RoBERTa y la familia GPT-3/GPT-4 usan todos BPE a nivel de bytes.
      </p>

      <h2>Los tres lado a lado</h2>
      <Fig caption="Un resumen de los tres algoritmos. Los tokenizadores reales agregan detalles encima, como tokens especiales, normalización y reglas de pretokenización.">
        <div className={s.tableWrap}>
          <table className={`${s.tbl} ${s.compare}`}>
            <thead>
              <tr><th scope="col"></th><th scope="col">BPE</th><th scope="col">WordPiece</th><th scope="col">Unigram</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Entrenamiento</th><td>Crecer: fusionar el par más frecuente</td><td>Crecer: fusionar el par con mejor puntuación</td><td>Reducir: podar los pedazos menos útiles</td></tr>
              <tr><th scope="row">Tokenización</th><td>Volver a aplicar las fusiones en orden</td><td>Coincidencia más larga, de izquierda a derecha</td><td>La división más probable</td></tr>
              <tr><th scope="row">Texto desconocido</th><td>A nivel de bytes: nada es desconocido</td><td><code>[UNK]</code> para la palabra</td><td>Caracteres sueltos; los caracteres nunca vistos se vuelven <code>&lt;unk&gt;</code> salvo que esté activado el respaldo de bytes</td></tr>
              <tr><th scope="row">Lo usan</th><td>GPT-2, RoBERTa, GPT-4 (a nivel de bytes); LLaMA (con SentencePiece)</td><td>BERT, DistilBERT</td><td>T5, ALBERT, XLNet (con SentencePiece)</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>
      <Callout title="Tenlo en cuenta">
        Ninguno de estos algoritmos sabe nada de gramática. <code>est</code> se volvió un token porque era frecuente en el corpus, no porque sea un sufijo. Cambia el texto de entrenamiento y obtendrás otro vocabulario.
      </Callout>
      <p>
        Eso último tiene consecuencias reales. Un tokenizador entrenado sobre todo con inglés divide otros idiomas en más pedazos y más pequeños, lo que los hace más lentos y más caros de procesar; mira <ArticleLink slug="why-emoji-cost-more-tokens">Por qué los emoji y algunos idiomas cuestan más tokens</ArticleLink>.
        Una vez que el texto son tokens, cada ID de token se convierte en un vector, como se explica en <ArticleLink slug="what-are-embeddings">¿Qué son los embeddings?</ArticleLink>
        Puedes comparar cómo dividen tu propio texto varios tokenizadores BPE reales en el <Link href="/tokenizer">Tokenizador</Link>.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://huggingface.co/learn/llm-course/chapter6/5", title: "Byte-Pair Encoding tokenization", source: "Hugging Face LLM Course", note: "las secciones 6 y 7 tratan WordPiece y Unigram (en inglés)" },
  { href: "https://www.youtube.com/watch?v=zduSFxRajkE", title: "Let’s build the GPT Tokenizer", source: "Andrej Karpathy · video", note: "construye BPE a nivel de bytes desde cero (en inglés)" },
  { href: "https://arxiv.org/abs/1508.07909", title: "Neural Machine Translation of Rare Words with Subword Units", source: "Sennrich, Haddow & Birch · arXiv", note: "en inglés" },
  { href: "https://en.wikipedia.org/wiki/Byte_pair_encoding", title: "Byte pair encoding", source: "Wikipedia", note: "en inglés" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Qué es byte-pair encoding (BPE)?", a: "Byte-pair encoding es una forma de construir el vocabulario de un tokenizador a partir de datos. Empieza con caracteres o bytes sueltos, busca el par de vecinos que aparece más seguido en el texto de entrenamiento, fusiona ese par en un token nuevo y repite hasta que el vocabulario llega al tamaño buscado. Los modelos GPT usan una versión de BPE a nivel de bytes." },
  { q: "¿Cuál es la diferencia entre BPE, WordPiece y Unigram?", a: "BPE fusiona el par de pedazos más frecuente. WordPiece, que usa BERT, fusiona el par que más mejora la verosimilitud del texto de entrenamiento, lo que favorece a los pares que aparecen juntos más de lo esperable. Unigram, que se usa con SentencePiece en modelos como T5, empieza con un vocabulario grande y quita los pedazos que menos importan." },
  { q: "¿Qué tokenizador usa GPT-4?", a: "GPT-4 y GPT-3.5 usan cl100k_base, un tokenizador BPE a nivel de bytes con unos 100,000 tokens. GPT-4o usa o200k_base, con unos 200,000 tokens, que maneja con más eficiencia muchos idiomas distintos del inglés. Los dos están disponibles en tiktoken, la biblioteca de código abierto de OpenAI." },
  { q: "¿Puede fallar un tokenizador con un texto desconocido?", a: "Un tokenizador a nivel de bytes no. Los 256 valores de byte están en su vocabulario, así que cualquier texto, incluidos los emoji y los sistemas de escritura raros, se puede escribir byte por byte si no coincide ningún pedazo más grande. Los tokenizadores por palabras, y algunos por caracteres, reemplazan en cambio lo que nunca vieron con un token desconocido." },
];
