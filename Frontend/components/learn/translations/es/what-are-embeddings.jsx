import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { WordMap } from "./what-are-embeddings.figures";
import s from "@/components/learn/articles/what-are-embeddings.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW] = CLUSTER_COLORS;

// First 16 of the 300 numbers for each word in the site's GloVe file.
const DENSE = {
  cat: [-0.59, -0.05, 0.23, -0.78, 0.26, 0.03, 0.09, 0.46, -0.43, 0.55, -0.19, 0.16, -0.45, -0.43, -0.63, -0.51],
  dog: [-0.63, 0.14, 0.52, -0.71, 0.12, 0.4, 0.05, 0.18, -0.19, 0.64, -0.3, 0.83, -0.23, -0.84, -0.25, -0.44],
  car: [0.25, 0.51, -0.59, -0.39, 0.15, 0.32, -0.15, -0.32, -0.19, -0.04, -0.51, 0.17, -0.35, -0.06, 0.44, -0.3],
};
const ONE_HOT = { cat: 3, dog: 9, car: 13 };

function OneHotVsDense() {
  return (
    <Fig caption="Arriba: vectores one-hot, dibujados con 16 casillas en lugar de 10,000 (ilustrativo). Cada palabra enciende su propia casilla, así que ningún par de palabras comparte nada. Abajo: los primeros 16 de los 300 números reales de GloVe para las mismas palabras (verde azulado positivo, rojo negativo). cat (gato) y dog (perro) tienen un patrón parecido; car (carro) es distinto.">
      <div className={s.vecRows} role="img" aria-label="Los vectores one-hot de cat, dog y car no comparten ninguna casilla llena; sus vectores densos de GloVe muestran a cat y dog con patrones parecidos y a car con uno distinto.">
        <p className={s.vecNote}>one-hot · una casilla por palabra del vocabulario</p>
        {Object.entries(ONE_HOT).map(([w, on]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={s.slots} style={{ "--tc": SKY }}>
              {Array.from({ length: 16 }, (_, i) => <i key={i} data-on={i === on ? "" : undefined} />)}
            </span>
          </div>
        ))}
        <p className={s.vecNote}>embedding · números aprendidos (los primeros 16 de 300)</p>
        {Object.entries(DENSE).map(([w, vals]) => (
          <div key={w} className={s.vecRow}>
            <span>{w}</span>
            <span className={`${s.slots} ${s.dense}`}>
              {vals.map((v, i) => <i key={i} style={{ "--tc": v < 0 ? RED : TEAL, "--a": Math.min(1, Math.abs(v) * 1.2) }} />)}
            </span>
          </div>
        ))}
      </div>
    </Fig>
  );
}

// Angles are arccos of the real cosine similarity between "cat" and each word.
const ANGLES = [["dog", 0.722, TEAL, 190], ["car", 0.282, YELLOW, 160], ["democracy", 0.148, RED, 200]];

function CosineFan() {
  const ox = 150, oy = 230, len = 190;
  return (
    <Fig caption="La similitud coseno tiene que ver con el ángulo entre dos flechas. Cada flecha está dibujada con el ángulo real entre el vector de GloVe de esa palabra y el de cat (cat–dog 0.72, unos 44°; cat–car 0.28, unos 74°; cat–democracy 0.15, unos 81°). Aquí solo importan los ángulos, no las longitudes.">
      <svg viewBox="0 0 420 260" className={l.big} role="img" aria-label="Flechas que salen de un mismo origen: cat a lo largo de la base, dog a 44 grados, car a 74 grados, democracy a 81 grados.">
        <line x1={ox} y1={oy} x2={ox + len} y2={oy} stroke={SKY} strokeWidth="2.5" />
        <text x={ox + len + 6} y={oy + 4} className={s.label}>cat</text>
        {ANGLES.map(([w, c, col, arm]) => {
          const a = Math.acos(c);
          const x = ox + Math.cos(a) * arm, y = oy - Math.sin(a) * arm;
          const r = 60 + (w === "dog" ? 0 : w === "car" ? 22 : 44);
          const ax = ox + Math.cos(a) * r, ay = oy - Math.sin(a) * r;
          return (
            <g key={w}>
              <line x1={ox} y1={oy} x2={x} y2={y} stroke={col} strokeWidth="2.5" />
              <path d={`M${ox + r} ${oy} A${r} ${r} 0 0 0 ${ax} ${ay}`} fill="none" stroke={col} strokeOpacity=".5" />
              <text x={w === "democracy" ? x - 6 : x + 6} y={y - 4} textAnchor={w === "democracy" ? "end" : "start"} className={s.label}>{w} · {c.toFixed(2)}</text>
            </g>
          );
        })}
        <circle cx={ox} cy={oy} r="3.5" fill="#fff" />
      </svg>
    </Fig>
  );
}

function BankContexts() {
  return (
    <Fig caption="Ilustrativo. Un embedding estático le da a “bank” un solo vector para las dos frases (“Se sentó en la orilla del río y miró el agua” y “Pasó sus ahorros a otro banco”). Un modelo contextual parte de ese mismo vector, y luego sus capas mezclan las palabras de alrededor, así que los dos usos terminan en lugares distintos.">
      <div className={s.ctx}>
        <p className={s.sentence}>She sat on the river <b style={{ "--tc": TEAL }}>bank</b> and watched the water.</p>
        <p className={s.sentence}>He moved his savings to another <b style={{ "--tc": YELLOW }}>bank</b>.</p>
        <svg viewBox="0 0 420 150" className={l.big} role="img" aria-label="Diagrama: un vector estático de bank se divide en dos vectores contextuales, uno para la frase del río y otro para la frase de los ahorros.">
          <circle cx="60" cy="75" r="6" fill={SKY} />
          <text x="60" y="100" textAnchor="middle" className={s.label}>bank (estático)</text>
          <path d="M70 72 C140 40 180 30 240 32" fill="none" stroke={TEAL} strokeWidth="2" strokeDasharray="4 4" />
          <path d="M70 78 C140 110 180 120 240 118" fill="none" stroke={YELLOW} strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="248" cy="32" r="6" fill={TEAL} />
          <circle cx="248" cy="118" r="6" fill={YELLOW} />
          <text x="260" y="36" className={s.label}>bank + “river”</text>
          <text x="260" y="122" className={s.label}>bank + “savings”</text>
          <text x="160" y="80" textAnchor="middle" className={s.dimText}>se mezcla el contexto</text>
        </svg>
      </div>
    </Fig>
  );
}

export default function WhatAreEmbeddings() {
  return (
    <>
      <p>
        Las computadoras son buenas con los números y malas con el significado. Antes de que un modelo pueda hacer algo útil con la palabra <code>cat</code> (“gato”), tiene que convertirla en números.
        La pregunta interesante es <em>qué</em> números. Un <strong>embedding</strong> es la respuesta que usan casi todos los sistemas de lenguaje modernos:
        una lista de números para cada palabra (o token), aprendida a partir de texto y acomodada para que las palabras con significados parecidos reciban listas parecidas.
      </p>

      <h2>¿Por qué no darle simplemente un número a cada palabra?</h2>
      <p>
        La idea más simple es numerar el vocabulario: <code>the</code> es 1, <code>cat</code> es 2, y así. Esto es más o menos lo que hace un tokenizador
        (mira <ArticleLink slug="why-tokens">Por qué los modelos leen tokens</ArticleLink>). Pero los números son etiquetas arbitrarias. En la lista de 10,000 palabras que se usa abajo, <code>cat</code> es el número 5,606 y <code>dog</code> (“perro”) el 3,037, pero
        eso no dice nada sobre gatos y perros. Un modelo concluiría tan tranquilo que <code>dog</code> es “más chico” que <code>cat</code>, lo cual no tiene sentido.
      </p>
      <p>
        La solución clásica es un <strong>vector one-hot</strong>: una lista con una casilla por cada palabra del vocabulario, todo en cero salvo un único 1 en la casilla de esa palabra.
        Con un vocabulario de 10,000 palabras, cada palabra se convierte en 10,000 números. Ya no hay un orden falso, pero aparece un problema nuevo:
        cada par de palabras es exactamente igual de distinto que cualquier otro par. <code>cat</code> no está más cerca de <code>dog</code> que de <code>democracy</code> (“democracia”).
        La representación no lleva ningún significado.
      </p>
      <OneHotVsDense />

      <h2>Una lista corta de números aprendidos</h2>
      <p>
        Un embedding le da la vuelta al enfoque. Cada palabra recibe un vector <strong>denso</strong>: una lista mucho más corta (a menudo de 100 a 1,000 números, aquí 300) en la que cada posición tiene algún valor.
        Nadie elige estos valores a mano. Empiezan siendo aleatorios y se ajustan durante el entrenamiento hasta que las palabras que se usan de forma parecida terminan con listas parecidas.
      </p>
      <p>
        Si tratas cada lista de 300 números como coordenadas, cada palabra se vuelve un punto en un espacio de 300 dimensiones. “Significado parecido” pasa a ser “cerca”.
        No podemos dibujar 300 dimensiones, pero sí podemos aplastar un puñado de palabras a dos y echar un vistazo.
      </p>
      <Fig caption="Datos reales de GloVe. 42 palabras colocadas en 2D para que sus distancias se parezcan lo más posible a las distancias en 300 dimensiones (un método llamado MDS, aplicado solo a estas 42 palabras, así que la disposición es aproximada). La lista debajo del mapa es exacta: los seis vecinos más cercanos de cada palabra según la similitud coseno entre las 10,000 palabras. Prueba apple (manzana), rice (arroz) y mouse (ratón).">
        <WordMap />
      </Fig>
      <p>
        Los grupos se forman solos: a los vectores nunca se les dijo qué es un animal o un país. Las sorpresas enseñan igual de mucho.
        <code>apple</code> queda entre la comida y la tecnología, y todos sus vecinos más cercanos son empresas, porque el texto de entrenamiento habla mucho más de Apple la empresa que de la fruta.
        La palabra más cercana a <code>rice</code> es <code>condoleezza</code>, por la exsecretaria de Estado de Estados Unidos. <code>mouse</code> se ve atraído hacia las caricaturas y las computadoras.
        Un embedding refleja cómo se <em>usan</em> las palabras en su texto de entrenamiento, no lo que dice un diccionario.
      </p>

      <h2>Conocerás una palabra por las compañías que frecuenta</h2>
      <p>
        ¿Por qué “usarse de forma parecida” debería producir “significado parecido”? Es la <strong>hipótesis distribucional</strong>, que el lingüista J.R. Firth resumió en 1957:
        “You shall know a word by the company it keeps” (“Conocerás una palabra por las compañías que frecuenta”). Piensa en el hueco de “I poured some ___ into my cup” (“Me serví un poco de ___ en la taza”). <code>coffee</code> (café), <code>tea</code> (té) y <code>milk</code> (leche) encajan;
        <code>bicycle</code> (bicicleta) no. Las palabras que encajan en los mismos huecos a lo largo de millones de frases probablemente están relacionadas, y eso es algo que una computadora puede medir sin entender nada.
      </p>

      <h2>Cómo se aprenden los números</h2>
      <p>
        Dos métodos famosos de la década de 2010 muestran la idea con claridad. Los dos leen una gran cantidad de texto y producen un vector por palabra.
      </p>
      <ul>
        <li>
          <strong>word2vec</strong> (Mikolov y sus colegas en Google, 2013) juega a las adivinanzas. Toma una palabra de una frase e intenta predecir las palabras que la rodean
          (o al revés). Cada vez que falla, ajusta un poquito los vectores que intervienen. Tras miles de millones de ajustes, las palabras que predicen los mismos vecinos quedan empujadas hacia vectores parecidos.
        </li>
        <li>
          <strong>GloVe</strong> (Pennington, Socher y Manning en Stanford, 2014) empieza contando cuántas veces aparece cada par de palabras cerca la una de la otra en todo el corpus.
          Luego ajusta los vectores para que, al comparar los vectores de dos palabras, se pueda predecir cuántas veces aparecen juntas.
        </li>
      </ul>
      <p>
        Recetas distintas, mismo resultado: una tabla con una fila de números por palabra. Se llaman embeddings <strong>estáticos</strong>, porque cada palabra recibe exactamente un vector,
        sin importar en qué frase aparezca.
      </p>

      <h2>Una palabra, muchos significados: embeddings contextuales</h2>
      <p>
        Los vectores estáticos tienen un punto débil evidente. <code>bank</code> puede ser la orilla de un río o un lugar que guarda dinero, pero solo recibe un vector.
        En estos datos de GloVe, sus vecinos más cercanos son <code>banks</code>, <code>banking</code>, <code>central</code>, <code>credit</code> y <code>financial</code>. El significado de río casi desaparece.
      </p>
      <BankContexts />
      <p>
        Los modelos de lenguaje modernos conservan la tabla de búsqueda como primer paso: cada ID de token se cambia por un vector aprendido, exactamente como arriba.
        Pero después los vectores pasan por muchas capas de <strong>atención</strong>, donde el vector de cada token se actualiza usando los tokens de alrededor
        (mira <ArticleLink slug="attention-and-transformers">La atención y el transformer</ArticleLink>). En las capas finales, “bank” en una frase sobre ríos tiene un vector distinto
        al de “bank” en una frase sobre ahorros. Son <strong>embeddings contextuales</strong>: el vector depende de toda la frase, no solo de la palabra.
      </p>
      <Callout title="La misma palabra, vectores distintos">
        Cuando alguien dice “el embedding de una palabra” en un modelo moderno, pregunta cuál: el vector fijo de la tabla de entrada o el vector que depende del contexto dentro del modelo. No son lo mismo.
      </Callout>

      <h2>Medir la cercanía: la similitud coseno</h2>
      <p>
        Para decir que dos palabras están “cerca”, necesitamos una forma de medirlo. La más común es la <strong>similitud coseno</strong>. Imagina cada vector como una flecha que sale del origen.
        La similitud coseno es el coseno del ángulo entre dos flechas: 1 cuando apuntan hacia el mismo lado, 0 cuando forman un ángulo recto y −1 cuando apuntan en direcciones opuestas.
      </p>
      <CosineFan />
      <p>
        En la práctica se calcula multiplicando las dos listas posición por posición, sumando los resultados (el <strong>producto punto</strong>) y dividiendo entre las longitudes de las dos flechas.
        Dividir entre la longitud hace que solo importe la dirección, lo cual es útil porque la longitud de un vector puede reflejar cosas como cuántas veces aparece una palabra, más que lo que significa.
        En los datos de GloVe, <code>cat</code> y <code>dog</code> dan 0.72 y <code>king</code> (rey) y <code>queen</code> (reina) dan 0.70, mientras que <code>cat</code> y <code>car</code>, que solo se diferencian en una letra, dan apenas 0.28.
        El embedding no sabe nada de ortografía, solo de uso.
      </p>
      <p>
        La distancia en línea recta (<strong>euclidiana</strong>) también funciona, y cuando todos los vectores se escalan a longitud 1 ordena los vecinos exactamente igual que la similitud coseno.
      </p>

      <h2>Por qué importa</h2>
      <p>
        Una vez que el significado es una posición, muchas tareas se vuelven geometría. Los buscadores encuentran documentos cuyos embeddings están cerca del de tu consulta. Los sistemas de recomendación sugieren cosas cercanas a las que te gustaron.
        Los chatbots que buscan información en tus archivos (lo que suele llamarse generación aumentada por recuperación) convierten cada fragmento de texto en un embedding y recuperan los fragmentos más cercanos a la pregunta.
        Y dentro de todo modelo de lenguaje, los embeddings son la forma en que el texto entra por primera vez a la red (mira <ArticleLink slug="how-llms-work">Cómo un modelo de lenguaje convierte tus palabras en una respuesta</ArticleLink>).
      </p>
      <p>
        El espacio en el que viven estos vectores tiene más estructura que solo “cerca” y “lejos”: las direcciones también pueden llevar significado. Ese es el tema de{" "}
        <ArticleLink slug="latent-space">El espacio latente</ArticleLink>. Cómo dibujar 300 dimensiones en una pantalla plana sin engañarte se explica en{" "}
        <ArticleLink slug="dimensionality-reduction">Ver muchas dimensiones</ArticleLink>. Para explorar 10,000 vectores de palabras reales en 3D, abre el <Link href="/embedding">explorador de Embeddings</Link>,
        y para un recorrido pensado para este sitio, mira <ArticleLink slug="how-a-word-becomes-300-numbers">Cómo una palabra se convierte en 300 números</ArticleLink>.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://jalammar.github.io/illustrated-word2vec/", title: "The Illustrated Word2vec", source: "Jay Alammar", note: "un recorrido visual por cómo se entrena word2vec (en inglés)" },
  { href: "https://www.3blue1brown.com/lessons/gpt", title: "Transformers, the tech behind LLMs", source: "3Blue1Brown", note: "incluye una sección preciosa sobre los embeddings de palabras (en inglés)" },
  { href: "https://arxiv.org/abs/1301.3781", title: "Efficient Estimation of Word Representations in Vector Space", source: "Mikolov et al., 2013", note: "el artículo original de word2vec (en inglés)" },
  { href: "https://nlp.stanford.edu/projects/glove/", title: "GloVe: Global Vectors for Word Representation", source: "Stanford NLP", note: "página del proyecto con el artículo y las descargas (en inglés)" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Qué es un embedding en machine learning?", a: "Un embedding es una lista de números, un vector, que representa algo como una palabra, una frase o una imagen. Los números se aprenden para que las cosas con significado o uso parecido terminen cerca unas de otras, lo que permite que una computadora mida la similitud con aritmética sencilla." },
  { q: "¿Cuál es la diferencia entre un token y un embedding?", a: "Un token es un pedazo de texto con un número de ID, y el ID por sí mismo no lleva ningún significado. Un embedding es el vector que el modelo busca para ese ID: cientos o miles de números aprendidos que colocan al token en un espacio donde los tokens parecidos quedan cerca unos de otros." },
  { q: "¿Qué es la similitud coseno?", a: "La similitud coseno mide el ángulo entre dos vectores. Vale 1 cuando apuntan hacia el mismo lado, 0 cuando forman un ángulo recto y −1 cuando apuntan en direcciones opuestas. Es la forma más común de comparar embeddings porque ignora la longitud del vector y solo mira la dirección." },
  { q: "¿Para qué sirven los embeddings?", a: "Los embeddings están detrás de la búsqueda semántica, las recomendaciones, la agrupación en clústeres, la detección de duplicados y la generación aumentada por recuperación (RAG), en la que los documentos se guardan como vectores y los más cercanos a una pregunta se le pasan a un modelo de lenguaje. Dentro de todo modelo de lenguaje, el primer paso es convertir cada token en un embedding." },
];
