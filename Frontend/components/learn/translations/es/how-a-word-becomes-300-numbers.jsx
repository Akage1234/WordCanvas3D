import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import s from "@/components/learn/learn.module.css";

const [RED, TEAL] = CLUSTER_COLORS;

const KING = {
  king: [-0.07, -0.37, -0.21, -0.88, 0.06, -0.26, 0.34, -0.23],
  queen: [-0.08, -0.3, -0.18, -0.81, -0.66, 0.07, 0.21, -0.34],
  man: [-0.02, -0.02, -0.4, 0.27, 0.18, 0.28, -0.27, 0.1],
  apple: [-0.17, 0.13, 0.34, -0.71, -0.21, -0.77, -0.44, 0.26],
};
const SIMS = [["cat", "dog", 0.722], ["king", "queen", 0.696], ["king", "man", 0.468], ["cat", "car", 0.282], ["king", "apple", 0.269]];

export default function WordToNumbers() {
  return (
    <>
      <p>
        Un tokenizador convierte el texto en ID, pero un ID es solo una posición en una lista. Nada en el número 9059 dice “cat” (gato).
        Para trabajar con el significado, un modelo necesita una representación en la que las palabras parecidas se vean parecidas. Esa representación es un <strong>embedding</strong>:
        una lista de números, a menudo de unos cientos, para cada palabra o token. A esa lista también se le llama <strong>vector</strong>, y cada posición dentro de ella es una <strong>dimensión</strong>.
      </p>
      <p>
        Esta guía se limita a lo que muestra la página de Embeddings del sitio. Para la idea en sí, construida desde cero, lee <ArticleLink slug="what-are-embeddings">¿Qué son los embeddings?</ArticleLink>
      </p>
      <p>
        La página de Embeddings de este sitio muestra tres conjuntos clásicos de embeddings de palabras: <strong>GloVe</strong>, <strong>Word2Vec</strong> y <strong>FastText</strong>.
        En los tres, cada palabra es una lista de exactamente 300 números.
      </p>

      <h2>Cómo se ven 300 números</h2>
      <p>Estos son los primeros 8 de los 300 números de cuatro palabras (king, “rey”; queen, “reina”; man, “hombre”; apple, “manzana”), tomados de los datos de GloVe que usa este sitio.</p>
      <Fig caption="Los primeros 8 de 300 valores de GloVe, redondeados. El verde azulado es positivo, el rojo es negativo, y un color más intenso significa un valor más grande.">
        <div className={s.cells}>
          {Object.entries(KING).map(([word, values]) => (
            <div key={word} style={{ display: "contents" }}>
              <span>{word}</span>
              {values.map((v, i) => (
                <span key={i} className={s.cell} style={{ background: `color-mix(in srgb, ${v < 0 ? RED : TEAL} ${Math.round(Math.abs(v) * 90)}%, #1a1d24)` }}>
                  {v.toFixed(2)}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Fig>
      <p>
        Ningún número por sí solo significa “de la realeza” o “fruta”. El significado está repartido entre los 300 a la vez. Aun así, incluso esta pequeña muestra deja ver un patrón:
        <code>king</code> y <code>queen</code> tienen una forma parecida en varias posiciones, mientras que <code>man</code> y <code>apple</code> van por su lado.
        Lo que las dimensiones capturan y lo que no es el tema de <ArticleLink slug="latent-space">El espacio latente</ArticleLink>.
      </p>

      <h2>De dónde salen los números</h2>
      <p>
        Los tres modelos se basan en la misma idea, que a menudo se resume con una frase del lingüista J.R. Firth:
        “You shall know a word by the company it keeps” (“Conocerás una palabra por las compañías que frecuenta”). Las palabras que aparecen en contextos parecidos tienden a tener significados parecidos.
        Los modelos leen cantidades enormes de texto y ajustan los números de cada palabra hasta que las palabras con vecinos parecidos terminan con listas parecidas.
      </p>
      <ul>
        <li>
          <strong>Word2Vec</strong> (Google, 2013) entrena una pequeña red neuronal con un juego de adivinanzas sencillo: predecir las palabras que rodean a una palabra dada, o la palabra a partir de las que la rodean.
          Después del entrenamiento, los pesos internos de la red para cada palabra se vuelven su embedding.
        </li>
        <li>
          <strong>GloVe</strong> (Stanford, 2014) primero cuenta cuántas veces aparece cada par de palabras cerca la una de la otra en todo el corpus.
          Luego ajusta los vectores para que la relación entre los vectores de dos palabras refleje cuántas veces aparecen juntas.
        </li>
        <li>
          <strong>FastText</strong> (Facebook, 2016–17) amplía Word2Vec aprendiendo también vectores para trozos de caracteres dentro de las palabras, así que <code>walk</code>, <code>walking</code> y <code>walked</code> (caminar, caminando, caminó) comparten partes.
          Eso ayuda con las palabras raras y las variantes de escritura.
        </li>
      </ul>
      <p>
        Los detalles también cambian en los datos. Los vectores de GloVe de aquí están todos en minúsculas. Word2Vec y FastText conservan las mayúsculas, así que <code>Paris</code> y <code>paris</code> pueden ser entradas distintas,
        y el conjunto de Word2Vec incluye incluso frases unidas como <code>prime_minister</code> (primer ministro).
      </p>

      <h2>Medir la similitud</h2>
      <p>
        Si cada palabra es un punto en un espacio de 300 dimensiones, “significado parecido” pasa a ser “apuntar en una dirección parecida”.
        La medida habitual es la <strong>similitud coseno</strong>: 1 significa que los dos vectores apuntan hacia el mismo lado, 0 significa que no tienen relación (forman un ángulo recto).
      </p>
      <Fig caption="Similitud coseno entre pares de palabras, calculada con los vectores de GloVe del sitio (cat, “gato”; dog, “perro”; car, “carro”).">
        <table className={s.table}>
          <thead><tr><th>Par</th><th>Similitud</th></tr></thead>
          <tbody>
            {SIMS.map(([a, b, v]) => <tr key={a + b}><td>{a} · {b}</td><td>{v.toFixed(2)}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        Los números coinciden con la intuición: <code>cat</code> está mucho más cerca de <code>dog</code> que de <code>car</code>, aunque <code>cat</code> y <code>car</code> solo se diferencian en una letra.
        El embedding no sabe nada de ortografía; solo sabe de uso.
      </p>

      <h2>En qué se equivocan los embeddings</h2>
      <p>
        El uso es también de donde salen las sorpresas. En estos datos de GloVe, los vecinos más cercanos de <code>apple</code> son <code>microsoft</code>, <code>google</code> e <code>intel</code>.
        El texto de entrenamiento hablaba mucho más de la empresa que de la fruta.
      </p>
      <p>
        Los opuestos también pueden quedar cerca. <code>good</code> (bueno) y <code>bad</code> (malo) tienen una similitud de alrededor de 0.72, porque aparecen en frases casi idénticas: “the food was good”, “the food was bad” (“la comida estaba buena”, “la comida estaba mala”).
      </p>
      <p>
        Además, estos modelos son <strong>estáticos</strong>: cada palabra recibe exactamente un vector, sin importar la frase. El <code>bank</code> de un río (orilla) y el <code>bank</code> que guarda tu dinero (banco) comparten un solo punto.
        Los modelos de lenguaje modernos lo resuelven ajustando el vector de cada token según las palabras que lo rodean, capa por capa
        (<ArticleLink slug="attention-and-transformers">La atención y el transformer</ArticleLink> muestra cómo). Pero su primer paso es el mismo que aquí:
        buscar un vector para cada ID de token en una gran tabla.
      </p>

      <h2>¿Por qué 300?</h2>
      <p>
        La longitud de la lista es una decisión de diseño que se toma antes del entrenamiento. Más números le dan al modelo más espacio para registrar distinciones finas,
        pero necesitan más datos de entrenamiento, más memoria y más cómputo. Para embeddings de palabras clásicos como estos, 300 se volvió un tamaño común.
        Con las 10,000 palabras que trae cada modelo aquí, son 3 millones de números por modelo.
      </p>
      <p>
        Los modelos de lenguaje grandes usan la misma idea a mayor escala, con vectores de token que a menudo tienen miles de números.
      </p>

      <h2>Ver el espacio</h2>
      <p>
        Nadie puede imaginar 300 dimensiones. La página de Embeddings toma 1,000, 5,000 o 10,000 palabras de un modelo y comprime sus vectores a 3D para que puedas volar entre ellas.
        Cómo funciona esa compresión, y lo que esconde, se explica en <Link href="/learn/pca-vs-umap">PCA vs UMAP</Link>.
      </p>
    </>
  );
}

export const faq = [
  { q: "¿Cuál es la diferencia entre GloVe, Word2Vec y FastText?", a: "Word2Vec aprende los vectores prediciendo una palabra a partir de sus vecinas, o las vecinas a partir de una palabra. GloVe aprende de una tabla global de cuántas veces aparecen juntas las palabras. FastText funciona como Word2Vec pero además usa pedazos de palabras, así que puede construir vectores para palabras que nunca vio en el entrenamiento." },
  { q: "¿Por qué los embeddings de palabras tienen 300 dimensiones?", a: "El número 300 no tiene nada de especial. Era un ajuste popular en las versiones originales de Word2Vec y GloVe porque equilibraba la calidad con la memoria y el tiempo de entrenamiento. Con menos dimensiones se capturan menos matices, y con muchas más la mejora es cada vez menor para vectores de palabras sueltas." },
  { q: "¿Qué no pueden hacer los embeddings de palabras estáticos?", a: "Le dan a cada palabra exactamente un vector, así que una palabra con varios significados, como “bank” (banco u orilla), recibe un solo promedio borroso. Salvo FastText, no tienen vector para las palabras fuera de su vocabulario, y reflejan los sesgos de su texto de entrenamiento. Los modelos de lenguaje modernos usan embeddings contextuales que cambian según la frase." },
  { q: "¿Cómo se mide la similitud entre dos palabras?", a: "Normalmente con la similitud coseno, que compara las direcciones de los dos vectores. Los valores cercanos a 1 significan que las palabras aparecen en contextos muy parecidos. Contextos parecidos suelen indicar significados parecidos, pero los opuestos como “hot” y “cold” (caliente y frío) también pueden puntuar alto porque se usan en los mismos lugares." },
];
