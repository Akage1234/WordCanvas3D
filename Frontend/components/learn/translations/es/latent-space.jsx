import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { WalkBetween } from "./latent-space.figures";
import s from "@/components/learn/articles/latent-space.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW, INDIGO, PURPLE] = CLUSTER_COLORS;

// All numbers below were computed offline from the site's GloVe file (10,000 words x 300 numbers, vectors scaled to length 1).

// The "gender direction": average of (woman - man), (girl - boy), (queen - king), (mother - father),
// (sister - brother), (aunt - uncle), (actress - actor), scaled to length 1. Its 300 components:
const GDIR = [0.01,-0.02,0.06,0.04,-0.13,-0.02,0.05,0.03,0.01,-0.02,-0.01,0.05,0.03,-0.06,-0.04,-0.07,-0.06,0.08,0.09,-0.13,0.02,-0.01,0.06,0.03,-0.05,0.02,0.03,0.1,0.03,-0.01,0.06,-0.16,0.02,0.08,-0.03,0.02,0.05,0.06,0.01,0.03,-0.02,0.15,0.06,0.03,0.02,0.03,0.1,-0.02,0.05,0.05,-0.04,0.01,-0.04,0,0.02,0.1,-0.04,0.2,0.04,0.02,-0.08,-0.12,0.01,0.02,0,0.02,0.09,0.07,0.1,0.01,-0.05,-0.03,-0.07,0,0.03,0.01,-0.06,0.03,-0.06,0.02,-0.01,0.02,0.02,0.02,-0.01,-0.02,0,-0.09,0.04,-0.07,0.03,-0.07,-0.03,0.03,-0.01,0.06,0.11,-0.08,0.09,0.04,-0.07,-0.14,0.06,0.04,0.03,0.08,-0.07,0.07,0.01,0,-0.05,0.08,0.04,0.11,-0.06,-0.11,-0.04,-0.08,0.01,0,0.02,0.02,-0.05,-0.01,0.03,-0.01,0.07,0.01,-0.02,-0.06,-0.06,-0.05,-0.02,0.07,-0.03,-0.07,0.03,-0.04,0.12,0.03,-0.04,-0.01,-0.03,-0.11,-0.04,-0.02,0.05,-0.12,0.07,-0.05,0.02,0.1,0.03,-0.01,0,0.01,0.07,-0.01,0.08,-0.01,0.01,-0.05,-0.1,-0.01,-0.02,0.11,0,0.12,-0.03,0,-0.03,-0.07,0,-0.12,-0.06,0.08,-0.01,-0.04,-0.03,0.06,0.02,0,0.02,-0.07,-0.1,0.04,-0.01,-0.11,-0.07,0.03,-0.14,-0.06,0.03,-0.11,-0.04,0.03,0,0.07,0.03,-0.04,-0.02,-0.06,-0.09,0,0.07,-0.06,-0.01,-0.12,0.08,-0.04,-0.03,0.02,-0.01,0.02,0.09,0.03,-0.04,0.03,0.04,0.04,0.07,-0.02,-0.07,0.03,-0.02,0.07,0.04,0.09,0.05,-0.01,0.03,0.08,-0.03,0.03,0.12,0.03,-0.04,0.11,0.04,-0.01,-0.04,-0.02,0.06,-0.08,0.03,-0.04,-0.02,-0.05,0.02,0.07,0.02,-0.05,-0.09,0.08,0.07,-0.05,-0.01,0.05,-0.04,-0.06,-0.04,0.02,-0.04,0.02,0.05,-0.05,0.05,-0.03,0.03,-0.02,-0.05,-0.02,0.03,-0.1,-0.01,-0.01,-0.07,-0.13,0.06,-0.09,0.07,-0.06,0.03,0,-0.03,-0.01,-0.05,0.06,0.02,0.01,0,0,0.12,0.02,-0.03,0.01,0.05,0,-0.01,0.04];

function DirectionStrip() {
  const W = 600, mid = 60;
  return (
    <Fig caption="Datos reales. Los 300 números que forman la “dirección de género” en GloVe (el promedio de siete diferencias como woman − man, “mujer − hombre”). Ninguna dimensión destaca: la más grande lleva apenas un 4% de la dirección, y hacen falta 36 de las 300 dimensiones para explicar la mitad.">
      <svg viewBox={`0 0 ${W} 124`} role="img" aria-label="Franja de 300 barras pequeñas, positivas y negativas, sin ninguna barra dominante.">
        <line x1="0" y1={mid} x2={W} y2={mid} className={s.axis} />
        {GDIR.map((v, i) => (
          <rect key={i} x={i * 2} width="1.5" y={v > 0 ? mid - v * 250 : mid} height={Math.abs(v) * 250} fill={v > 0 ? TEAL : RED} />
        ))}
        <text x="0" y="120" className={s.dimText}>dimensión 1</text>
        <text x={W} y="120" textAnchor="end" className={s.dimText}>dimensión 300</text>
      </svg>
    </Fig>
  );
}

// [a, b, a·x, a·y, b·x, b·y]: x = the gender direction, y = the main direction in which the pairs differ from each other.
const PROJ = [["man","woman",-0.272,-0.275,0.26,-0.263],["boy","girl",-0.182,-0.133,0.252,-0.184],["king","queen",-0.254,0.299,0.275,0.254],["father","mother",-0.278,0.226,0.239,0.194],["brother","sister",-0.405,0.316,0.308,0.345],["uncle","aunt",-0.371,0.41,0.285,0.426],["actor","actress",-0.25,-0.41,0.387,-0.339]];
const PAIR_COLORS = [SKY, TEAL, YELLOW, PURPLE, RED, INDIGO, "#26de81"];

function ParallelOffsets() {
  const px = (x) => 210 + x * 360, py = (y) => 150 - y * 300;
  return (
    <Fig caption="Datos reales, proyectados sobre dos direcciones elegidas: la horizontal es la dirección promedio “femenino menos masculino”, la vertical es la forma principal en que estos pares se diferencian entre sí. Como el eje horizontal se construye con estos mismos pares, es de esperar cierto paralelismo. La prueba más sólida está en las 300 dimensiones: los siete vectores de diferencia tienen una similitud coseno promedio de 0.58 entre sí, contra 0.07 para las diferencias entre pares de palabras al azar.">
      <svg viewBox="0 0 420 300" className={l.big} role="img" aria-label="Siete flechas, cada una de una palabra masculina a la izquierda a su equivalente femenina a la derecha, todas apuntando más o menos en la misma dirección.">
        <defs>
          {PAIR_COLORS.map((col, i) => (
            <marker key={i} id={`ls-arrow-${i}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" fill={col} />
            </marker>
          ))}
        </defs>
        {PROJ.map(([a, b, ax, ay, bx, by], i) => (
          <g key={a}>
            <line x1={px(ax)} y1={py(ay)} x2={px(bx)} y2={py(by)} stroke={PAIR_COLORS[i]} strokeWidth="2" markerEnd={`url(#ls-arrow-${i})`} />
            {a === "king"
              ? <text x={px(ax) + 2} y={py(ay) + 17} className={s.label}>{a}</text>
              : <text x={px(ax) - 8} y={py(ay) + (a === "brother" ? 0 : 5)} textAnchor="end" className={s.label}>{a}</text>}
            <text x={px(bx) + 8} y={py(by) + 5} className={s.label}>{b}</text>
          </g>
        ))}
      </svg>
    </Fig>
  );
}

// a − b + c, nearest words excluding the three inputs (standard practice), and the nearest word when inputs are NOT excluded.
const ANALOGIES = [
  ["king", "man", "woman", [["queen", 0.715], ["princess", 0.601], ["throne", 0.584]], "king"],
  ["paris", "france", "italy", [["rome", 0.783], ["milan", 0.68], ["italian", 0.666]], "rome"],
  ["bigger", "big", "small", [["smaller", 0.818], ["larger", 0.806], ["large", 0.652]], "smaller"],
  ["cats", "cat", "dog", [["dogs", 0.78], ["animals", 0.618], ["pet", 0.519]], "dogs"],
  ["brother", "man", "woman", [["daughter", 0.809], ["mother", 0.77], ["wife", 0.761]], "daughter"],
  ["walked", "walk", "swim", [["swimming", 0.525], ["raced", 0.423], ["ran", 0.423]], "swim"],
];

function AnalogyTable() {
  return (
    <Fig caption="Resultados reales de GloVe. “Top 3” deja fuera las tres palabras de entrada, como suelen hacer las pruebas de analogías. La última columna muestra la palabra más cercana cuando no se dejan fuera: para king − man + woman sigue siendo king. Las dos últimas filas no dan la respuesta buscada (sister, “hermana”; swam, “nadó”); sister queda en 6.º lugar, y swam no está en este vocabulario de 10,000 palabras.">
      <div className={l.scroll}>
        <table className={l.table}>
          <thead><tr><th>Suma</th><th>Top 3 (coseno)</th><th>Con las entradas</th></tr></thead>
          <tbody>
            {ANALOGIES.map(([a, b, c, top, incl]) => (
              <tr key={a + c}>
                <td>{a} − {b} + {c}</td>
                <td>{top.map(([w, v]) => `${w} ${v.toFixed(2)}`).join(", ")}</td>
                <td>{incl}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Fig>
  );
}

const OCC = [["captain",-0.219],["engineer",-0.203],["pilot",-0.169],["soldier",-0.148],["lawyer",-0.139],["scientist",-0.117],["doctor",-0.058],["artist",-0.023],["teacher",0.029],["singer",0.092],["dancer",0.142],["nurse",0.253]];
const REF = [["he", -0.231], ["she", 0.213]];

function OccupationBias() {
  const row = ([w, v], ref) => (
    <div key={w} className={s.occRow} style={{ "--tc": v < 0 ? SKY : PURPLE, "--w": Math.abs(v) / 0.26 }}>
      <span className={ref ? s.ref : undefined}>{w}</span>
      <span>{v < 0 && <i className={s.neg} style={{ display: "block" }} />}</span>
      <span className={s.occMid}>{v > 0 && <i className={s.pos} style={{ display: "block" }} />}</span>
      <small>{v > 0 ? "+" : ""}{v.toFixed(2)}</small>
    </div>
  );
  return (
    <Fig caption="Datos reales. Dónde caen las palabras de profesiones a lo largo de la dirección de género (su coseno con ella). En inglés estas palabras son neutras, y aun así sus vectores se inclinan hacia un lado o hacia el otro, reflejando cómo se usaron en el texto de entrenamiento. he (él) y she (ella) aparecen como referencia.">
      <div className={s.occ} role="img" aria-label="Gráfica de barras divergentes. captain (capitán), engineer (ingeniero) y pilot (piloto) se inclinan hacia el lado masculino; nurse (enfermera), dancer (bailarina) y singer (cantante) se inclinan hacia el lado femenino; teacher (docente) y artist (artista) quedan cerca de cero.">
        <div className={s.occHead}><span /><span>← hacia “he”</span><span>hacia “she” →</span><span /></div>
        {row(REF[0], true)}
        {OCC.map((o) => row(o))}
        {row(REF[1], true)}
      </div>
    </Fig>
  );
}

export default function LatentSpace() {
  return (
    <>
      <p>
        En <ArticleLink slug="what-are-embeddings">¿Qué son los embeddings?</ArticleLink> convertimos cada palabra en una lista de 300 números y vimos que las palabras parecidas terminan cerca unas de otras.
        El espacio en el que viven esos vectores tiene nombre: <strong>espacio latente</strong>. “Latente” quiere decir oculto. Nadie diseñó sus coordenadas; se aprendieron,
        y su significado hay que descubrirlo después. Este artículo trata de cómo es esa estructura oculta, qué se puede leer en ella y en qué engaña.
      </p>

      <h2>Qué significa “espacio latente”</h2>
      <p>
        Cualquier modelo que convierte una entrada en un vector de números define un espacio latente: el conjunto de todos los vectores que podría producir.
        Los embeddings de palabras son el ejemplo clásico, pero el mismo término se usa para los vectores internos de los generadores de imágenes, los modelos de voz y los modelos de lenguaje grandes.
        La propiedad clave es que la posición codifica algo sobre la entrada. Dos entradas que el modelo trata como parecidas caen cerca una de la otra.
      </p>
      <p>
        Todo lo que sigue usa vectores de palabras reales (GloVe, 300 dimensiones, 10,000 palabras comunes del inglés). Las ideas se aplican a otros espacios latentes, aunque los detalles cambien.
      </p>

      <h2>Los ejes no tienen nombre</h2>
      <p>
        Una primera suposición natural es que cada uno de los 300 números mide una cosa: la dimensión 12 para “es un animal”, la dimensión 40 para “es de la realeza”. En la práctica, las dimensiones individuales casi nunca son tan ordenadas.
      </p>
      <p>
        La razón es sencilla. Al entrenamiento solo le importa cómo se relacionan los vectores entre sí: sus distancias y sus ángulos. Si giraras todo el espacio, todas las distancias y ángulos seguirían iguales,
        y el modelo funcionaría exactamente igual de bien. Así que nada empuja a un concepto a alinearse con un eje en particular. El significado termina repartido entre muchas dimensiones a la vez.
      </p>
      <DirectionStrip />
      <p>
        Por eso leer un embedding número por número dice muy poco. El significado vive en las <strong>direcciones</strong>, y una dirección es una mezcla particular de los 300 números.
      </p>

      <h2>Las direcciones pueden llevar significado</h2>
      <p>
        Toma la flecha que va de <code>man</code> (hombre) a <code>woman</code> (mujer): la diferencia entre sus dos vectores. Ahora toma la flecha de <code>king</code> (rey) a <code>queen</code> (reina).
        Si el espacio aprendió algo coherente sobre el género, esas flechas deberían apuntar más o menos hacia el mismo lado. Lo hacen, y lo mismo pasa con las flechas boy→girl (niño→niña), uncle→aunt (tío→tía) y actor→actress (actor→actriz).
      </p>
      <ParallelOffsets />
      <p>
        Ese “más o menos” pesa mucho en la frase. Un coseno de 0.58 significa que las flechas comparten una dirección común, pero cada una tiene además sus propias particularidades. Otras relaciones son todavía más débiles.
        Las flechas de singular a plural (cat→cats, city→cities, child→children, etc.) coinciden mucho menos entre sí, con un coseno promedio de solo 0.23 en estos datos.
      </p>

      <h2>Las analogías como flechas paralelas</h2>
      <p>
        Si una flecha significa “hazlo femenino”, puedes sumársela a otras palabras. Ese es el famoso truco de las analogías: <code>king − man + woman</code> cae cerca de <code>queen</code>.
        La misma aritmética encuentra capitales (<code>paris − france + italy ≈ rome</code>) y comparativos (<code>bigger − big + small ≈ smaller</code>, “más grande − grande + pequeño ≈ más pequeño”).
      </p>
      <AnalogyTable />
      <p>
        Dos advertencias honestas. Primero, el vector resultante casi siempre sigue estando más cerca de una de las palabras de las que partiste, así que las pruebas de analogías se saltan discretamente las palabras de entrada.
        Segundo, es fácil mostrar las analogías que funcionan y olvidarse de las que no. El truco es una señal real de estructura, no un motor de razonamiento confiable.
        La guía del sitio <ArticleLink slug="king-man-woman">king − man + woman</ArticleLink> te deja probar las tuyas.
      </p>

      <h2>Vecindarios y clústeres</h2>
      <p>
        La estructura más simple de un espacio latente es el vecindario. Los colores quedan cerca de los colores, los números cerca de los números, las capitales cerca de sus países.
        Algoritmos como k-means pueden encontrar estos grupos automáticamente buscando aglomeraciones densas de puntos, y así es como se usan los embeddings para agrupar documentos o reseñas de clientes por tema.
      </p>
      <p>
        Los clústeres no vienen etiquetados, y sus bordes son difusos. Una palabra con varios sentidos queda entre grupos: <code>apple</code> queda entre la fruta y las empresas de tecnología.
        El nombre que le pongas a un clúster es tu interpretación, no algo guardado en los vectores.
      </p>

      <h2>Caminar entre dos puntos</h2>
      <p>
        Si las posiciones significan algo, ¿qué pasa con el espacio <em>entre</em> dos palabras? Puedes mezclar dos vectores, por ejemplo 70% <code>village</code> (pueblo) y 30% <code>city</code> (ciudad), y preguntar qué palabras reales están más cerca de la mezcla.
      </p>
      <Fig caption="Datos reales de GloVe. Cada paso mezcla los dos vectores de palabras y muestra las palabras más cercanas del vocabulario de 10,000 palabras. A la izquierda: la similitud con los dos extremos. A la derecha: las palabras más cercanas aparte de los dos extremos, con la primera en negrita. Usa el control deslizante o las flechas del teclado.">
        <WalkBetween />
      </Fig>
      <p>
        Aparecen dos cosas. Primero la honesta: en cada paso, una de las dos palabras de los extremos sigue siendo la palabra real más cercana. No hay ninguna palabra oculta “mitad pueblo, mitad ciudad” esperando en el medio.
        Pero las palabras en <em>segundo lugar</em> cambian de forma sensata. Entre village y city pasas por <code>town</code> (villa); entre hot (caliente) y cold (frío) pasas por <code>cool</code> (fresco) y <code>warm</code> (tibio);
        de king a queen pasas por <code>monarch</code> (monarca). El espacio es lo bastante suave como para que los puntos entre dos significados queden cerca de palabras que comparten los dos.
      </p>
      <p>
        En los generadores de imágenes esa suavidad se aprovecha. Muchos modelos generativos tienen espacios latentes donde los puntos entre dos imágenes se decodifican en imágenes intermedias creíbles, y así se hacen las animaciones de “transformación” suave.
      </p>

      <h2>No solo palabras</h2>
      <p>
        Hay espacios latentes en cualquier lugar donde un modelo convierte datos en vectores. Los modelos de <strong>embeddings de frases</strong> convierten frases completas en un vector cada una, así que “¿Cómo restablezco mi contraseña?” puede caer cerca de
        “Olvidé mis datos de acceso” aunque no compartan ninguna palabra. Los modelos de imágenes convierten fotos en vectores. Algunos modelos, como CLIP de OpenAI, se entrenan para que una foto y un texto que la describe
        caigan cerca uno del otro en un mismo espacio compartido, y eso es lo que permite buscar fotos con texto. Mira <ArticleLink slug="tokens-beyond-text">Tokens más allá del texto</ArticleLink> para ver cómo se cortan primero en pedazos las imágenes y el audio.
      </p>
      <p>
        Dentro de un modelo de lenguaje grande no hay un solo espacio latente sino muchos: cada capa produce vectores nuevos para cada token
        (mira <ArticleLink slug="attention-and-transformers">La atención y el transformer</ArticleLink>). Los investigadores también encuentran direcciones con significado ahí, pero leerlas es un área de investigación activa, no un problema resuelto.
      </p>

      <h2>Límites y sesgos</h2>
      <p>
        Un espacio latente es un registro comprimido de sus datos de entrenamiento, incluidas las partes que tal vez no queramos. Palabras como <code>nurse</code> (enfermero o enfermera) o <code>engineer</code> (ingeniero o ingeniera) no llevan género en su definición en inglés,
        pero aparecieron en contextos con género con tanta frecuencia que sus vectores se inclinan hacia un lado.
      </p>
      <OccupationBias />
      <p>
        Esto se documentó con cuidado en un artículo de 2016 cuyo título cita un resultado real de analogía: “Man is to Computer Programmer as Woman is to Homemaker?” (“¿El hombre es al programador lo que la mujer al ama de casa?”).
        En nuestros datos, <code>doctor − man + woman</code> da primero <code>physician</code> (médico) y en segundo lugar <code>nurse</code>. Cualquier sistema construido sobre embeddings, desde buscadores hasta herramientas de contratación,
        puede transmitir estos patrones. Existen técnicas para reducirlos, pero ninguna los elimina por completo.
      </p>
      <Callout title="Tenlo en cuenta">
        Un espacio latente muestra cómo se usaron las palabras en un montón de texto en particular. Es un espejo de ese texto, no un mapa de la verdad.
      </Callout>
      <p>
        Hay un límite más, y está de nuestro lado. Solo podemos mirar estos espacios a través de imágenes planas, y aplastar 300 dimensiones en dos siempre distorsiona algo.
        <ArticleLink slug="dimensionality-reduction"> Ver muchas dimensiones</ArticleLink> explica cómo se hacen esas imágenes y cómo leerlas sin dejarse engañar.
        Para explorar GloVe por tu cuenta, prueba el <Link href="/embedding">explorador de Embeddings</Link> o haz aritmética de palabras en el <Link href="/vector-playground">Laboratorio de vectores</Link>.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "su sección de embeddings muestra de forma visual direcciones como woman − man (en inglés)" },
  { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "mira la sección “linear substructures” (en inglés)" },
  { href: "https://arxiv.org/abs/1607.06520", title: "Man is to Computer Programmer as Woman is to Homemaker? Debiasing Word Embeddings", source: "Bolukbasi et al., 2016", note: "en inglés" },
  { href: "https://arxiv.org/abs/2103.00020", title: "Learning Transferable Visual Models From Natural Language Supervision", source: "Radford et al., 2021", note: "el artículo de CLIP: imágenes y texto en un mismo espacio (en inglés)" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Qué es el espacio latente en la inteligencia artificial?", a: "El espacio latente es el espacio de vectores que un modelo usa internamente para representar sus entradas. Cada punto es un embedding, y su posición refleja patrones que el modelo aprendió, no etiquetas que le haya puesto una persona. Las entradas parecidas terminan cerca unas de otras, y algunas direcciones del espacio coinciden con ideas como el plural, el tiempo verbal o el género." },
  { q: "¿Las dimensiones de un embedding tienen significado?", a: "Por lo general no una por una. Rara vez una sola dimensión corresponde a un concepto limpio; el significado suele estar repartido entre muchas dimensiones a la vez. Los patrones interpretables casi siempre aparecen como direcciones, combinaciones de dimensiones, y no como ejes individuales con nombre." },
  { q: "¿Por qué funciona king − man + woman ≈ queen?", a: "En muchos embeddings de palabras, la diferencia entre man (hombre) y woman (mujer) apunta más o menos en la misma dirección que la diferencia entre king (rey) y queen (reina). Restar man y sumar woman mueve el vector de king a lo largo de esa dirección, y la palabra más cercana al resultado suele ser queen. Funciona con algunas relaciones, pero no de forma confiable con todas." },
  { q: "¿Los embeddings pueden tener sesgos?", a: "Sí. Los embeddings aprenden de texto escrito por personas, así que absorben las asociaciones que hay en él, incluidos los estereotipos. Los investigadores han mostrado, por ejemplo, que algunos embeddings de palabras asocian ciertos trabajos más con un género que con otro. Medir y reducir este sesgo es un área de investigación activa." },
];
