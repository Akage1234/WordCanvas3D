import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import s from "@/components/learn/articles/tokens-beyond-text.module.css";
import { PatchCalculator, PatchSequence } from "./tokens-beyond-text.figures";

// Illustrative spectrogram: deterministic "energy" values, not real audio.
const COLS = 24;
const ROWS = 8;
const energy = (c, r) => (Math.sin(c * 0.9 + r * 1.7) * 0.5 + 0.5) * (1 - r / (ROWS + 2)) * (c % 6 < 4 ? 1 : 0.35);
const WAVE = Array.from({ length: 120 }, (_, i) => {
  const x = 10 + i * 1.5;
  const y = 70 + Math.sin(i * 0.9) * Math.sin(i * 0.11) * 28 * (i % 40 < 28 ? 1 : 0.25);
  return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
}).join(" ");

function AudioPipeline() {
  const cw = 7, ch = 11, sx = 232, sy = 26;
  return (
    <svg viewBox="0 0 640 150" className={s.audio} role="img"
      aria-label="Diagrama: una onda de sonido se convierte en un espectrograma, una cuadrícula de frecuencias a lo largo del tiempo, y cada franja corta del espectrograma se vuelve un vector en una fila de tokens de audio.">
      <text x="10" y="16">onda de sonido</text>
      <path d={WAVE} fill="none" stroke="#45b7d1" strokeWidth="1.4" />
      <path d="M198 70 h22 m-6 -5 l6 5 l-6 5" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      <text x={sx} y="16">espectrograma: tono × tiempo</text>
      {Array.from({ length: COLS * ROWS }, (_, k) => {
        const c = k % COLS, r = Math.floor(k / COLS);
        return <rect key={k} x={sx + c * cw} y={sy + r * ch} width={cw - 1} height={ch - 1} fill="#fd79a8" opacity={0.1 + energy(c, r) * 0.9} />;
      })}
      <rect x={sx + 8 * cw - 1} y={sy - 2} width={cw * 2 + 1} height={ROWS * ch + 3} fill="none" stroke="#fff" strokeWidth="1.2" />
      <path d="M404 70 h22 m-6 -5 l6 5 l-6 5" fill="none" stroke="#ffffff55" strokeWidth="1.5" />
      <text x="438" y="16">un vector por franja</text>
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={440 + i * 24} y="54" width="20" height="32" rx="4" fill={i === 4 ? "#fd79a8" : "#fd79a855"} />
      ))}
      <text x="438" y="108">… secuencia de tokens de audio</text>
      <text x={sx} y="130">una franja cada pocos milisegundos</text>
    </svg>
  );
}

export default function TokensBeyondText() {
  return (
    <>
      <p>
        A un transformer, el diseño detrás de los modelos de lenguaje modernos, en realidad no le importa qué <em>son</em> sus tokens.
        Lo único que recibe es una secuencia de vectores (listas de números), uno por token, y su trabajo es dejar que esos vectores se miren entre sí y se actualicen.
        En el texto, cada vector sale de un pedazo de palabra. Pero nada nos impide hacer vectores a partir de otras cosas.
      </p>
      <p>
        Así funcionan los modelos que ven imágenes y oyen sonido. El truco es siempre el mismo: <strong>cortar la entrada en pedazos pequeños, convertir cada pedazo en un vector y poner los vectores en fila como una secuencia</strong>.
        Este artículo muestra cómo se hace con imágenes, audio y video, y cómo se mezcla el resultado con texto.
      </p>

      <h2>Imágenes: una imagen vale 16×16 palabras</h2>
      <p>
        Una imagen digital es una cuadrícula de píxeles, y cada píxel son tres números: cuánto rojo, verde y azul tiene. Un solo píxel es demasiado pequeño para significar algo, igual que una sola letra.
        Tratar cada píxel como un token también produciría secuencias enormes: una foto modesta de 224 × 224 tiene más de 50,000 píxeles.
      </p>
      <p>
        El <strong>Vision Transformer</strong> (ViT), publicado por investigadores de Google en 2020 con el título “An Image is Worth 16x16 Words” (“Una imagen vale 16x16 palabras”), simplificó la idea.
        Se corta la imagen en una cuadrícula de cuadritos llamados <strong>parches</strong>, normalmente de 16 × 16 píxeles cada uno, y cada parche se trata como un token.
        Los parches se leen en orden, de izquierda a derecha y de arriba abajo, como las palabras en una página.
      </p>
      <Fig caption="Ilustrativo: una imagen cortada en una cuadrícula de 4 × 4 parches, que se suman a la misma secuencia que los tokens de texto de una pregunta (“What is in this picture?”, “¿Qué hay en esta imagen?”). Presiona Reproducir o avanza de parche en parche. Los modelos reales usan muchos más parches, y los tokens marcadores como <image> cambian de un modelo a otro.">
        <PatchSequence />
      </Fig>

      <h2>De un parche a un vector</h2>
      <p>
        Un parche sigue siendo solo píxeles. Para convertirlo en un vector de token, el modelo hace dos cosas sencillas.
      </p>
      <ul>
        <li>
          <strong>Aplanarlo.</strong> Un parche de 16 × 16 con tres valores de color por píxel son 16 × 16 × 3 = 768 números. Se ponen todos en una sola lista larga.
        </li>
        <li>
          <strong>Proyectarlo.</strong> Se multiplica esa lista por una matriz aprendida para obtener un vector del tamaño que espera el transformer. Esto cumple el mismo papel que la tabla de búsqueda que convierte el ID de un token de texto en un <ArticleLink slug="what-are-embeddings">embedding</ArticleLink>.
          (En el ViT de tamaño base, da la casualidad de que la salida también tiene 768 números).
        </li>
      </ul>
      <p>
        Por último, se suma un <strong>embedding de posición</strong> a cada vector, para que el modelo sepa de qué parte de la imagen salió el parche; sin él, una imagen revuelta se vería igual.
        A partir de aquí, los vectores de los parches pasan por <ArticleLink slug="attention-and-transformers">capas de atención</ArticleLink> normales, donde cada parche puede mirar a todos los demás.
      </p>
      <p>
        El tamaño del parche es un equilibrio, igual que el tamaño del vocabulario en el texto. Los parches más pequeños conservan más detalle pero producen muchos más tokens, y el costo de la atención crece rápido con la longitud de secuencia.
      </p>
      <Fig caption="En cuántos tokens se convierte una imagen. Reducir el parche a la mitad, o duplicar el tamaño de la imagen, da cuatro veces más tokens. Las cuentas son exactas; 224 × 224 píxeles con parches de 16 × 16 (196 tokens) es la configuración estándar de ViT.">
        <PatchCalculator />
      </Fig>

      <h2>¿Parches continuos o códigos discretos?</h2>
      <p>
        Hay una diferencia real con el texto. Un token de texto es una entrada de un vocabulario fijo, así que el modelo puede predecirlo eligiendo de una lista. El vector de un parche es <strong>continuo</strong>: sus números pueden ser cualquier cosa, y no hay lista.
        Para <em>entender</em> imágenes eso no es problema; la mayoría de los codificadores de visión, incluido ViT, funcionan así.
      </p>
      <p>
        Para <em>generar</em> imágenes un token a la vez, algunos modelos primero convierten las imágenes en tokens <strong>discretos</strong>.
        Una red entrenada por separado, como un VQ-VAE (autocodificador variacional con cuantización vectorial), aprende un <strong>libro de códigos</strong> (codebook): una lista fija de pedacitos de imagen típicos.
        Cada región de una imagen se reemplaza por el ID de la entrada del libro de códigos más parecida, así que una imagen se convierte en una cuadrícula de ID, exactamente como el texto.
        El DALL·E original, por ejemplo, convertía cada imagen de 256 × 256 en una cuadrícula de 32 × 32 con 1,024 tokens de imagen, cada uno elegido de un libro de códigos de 8,192 entradas, y los ponía después de hasta 256 tokens de texto en una sola secuencia.
      </p>
      <Fig caption="Las dos maneras de convertir una imagen en tokens. Los ejemplos salen de los artículos de ViT, VQ-VAE y DALL·E.">
        <div className={s.tableWrap}>
          <table className={s.tbl}>
            <thead>
              <tr><th scope="col"></th><th scope="col">Embeddings continuos de parches</th><th scope="col">Tokens de imagen discretos</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row">Un token es</th><td>Un vector calculado a partir de los píxeles de un parche</td><td>Un ID de un libro de códigos aprendido</td></tr>
              <tr><th scope="row">Vocabulario</th><td>Ninguno: cualquier vector es posible</td><td>Fijo, p. ej. 8,192 códigos en DALL·E</td></tr>
              <tr><th scope="row">Sirve para</th><td>Entender: clasificar, describir, responder preguntas</td><td>Generar imágenes token por token, como el texto</td></tr>
              <tr><th scope="row">Ejemplo</th><td>ViT: parches de 16 × 16 píxeles</td><td>DALL·E: cuadrícula de 32 × 32 códigos</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Audio: franjas de sonido</h2>
      <p>
        El sonido es una onda: una lista larga de mediciones de presión del aire, a menudo 16,000 o más por segundo. Son demasiadas para usar una por token, y una medición por sí sola no significa nada.
      </p>
      <p>
        Por eso los modelos de voz suelen empezar calculando un <strong>espectrograma</strong>, una imagen de qué frecuencias suenan fuerte en cada momento. El tiempo va en un eje y el tono en el otro, y cada franja corta de tiempo se vuelve una columna de números.
        Whisper, el reconocedor de voz de OpenAI, por ejemplo, toma clips de 30 segundos, calcula un espectrograma de 80 canales con una franja nueva cada 10 milisegundos (3,000 franjas), y luego dos pequeñas capas de convolución lo reducen a la mitad, a 1,500 vectores, antes de que los lea el transformer.
      </p>
      <Fig caption="Ilustrativo: de una onda de sonido a un espectrograma y a una secuencia de vectores de audio. Una franja de tiempo resaltada se convierte en un token. Los colores del espectrograma están dibujados a mano, no calculados a partir de audio real.">
        <div className={s.tableWrap}><AudioPipeline /></div>
      </Fig>
      <p>
        El audio también tiene su versión discreta. Los <strong>códecs de audio neuronales</strong>, como EnCodec de Meta, comprimen el sonido en un flujo de ID de un libro de códigos, varios por cada franja de tiempo.
        Esos ID se pueden predecir uno tras otro como texto, y así es como algunos generadores de voz y música producen audio.
      </p>

      <h2>Video: parches en el espacio y en el tiempo</h2>
      <p>
        Un video es una pila de imágenes. El enfoque más simple tokeniza cada fotograma en parches, pero eso multiplica el número de tokens por el número de fotogramas.
        Los transformers de video como ViViT cortan en cambio el video en <strong>tubelets</strong>: cajitas que abarcan un parche de la imagen <em>y</em> unos cuantos fotogramas seguidos.
        Cada tubelet se aplana y se proyecta en un vector, así que un solo token captura un poco de movimiento además de la apariencia.
        Aun así, el video sale caro: unos pocos segundos pueden producir miles de tokens, y por eso los modelos de video a menudo toman solo algunos de los fotogramas.
      </p>

      <h2>Todo en una sola secuencia</h2>
      <p>
        Un modelo multimodal suele armarse con piezas. Una receta común, la que usa el modelo de código abierto LLaVA, es:
      </p>
      <ul>
        <li>un <strong>codificador de visión</strong> preentrenado (en el caso de LLaVA, el ViT de CLIP) convierte la imagen en vectores de parches;</li>
        <li>una pequeña <strong>proyección</strong> aprendida lleva cada uno de esos vectores al mismo espacio que los embeddings de palabras del modelo de lenguaje, para que tengan la longitud correcta y “hablen el mismo idioma”;</li>
        <li>los tokens de imagen resultantes se ponen en la secuencia junto a los tokens de texto, y el modelo de lenguaje los lee todos juntos.</li>
      </ul>
      <p>
        Dentro del transformer no hay ningún trato especial. Un token de texto puede prestarle atención a un parche de imagen igual que a otra palabra, y así es como una pregunta como “What colour is the sun?” (“¿De qué color es el sol?”) encuentra el parche que contiene el sol.
      </p>
      <Callout title="La gran idea">
        Cualquier cosa que se pueda cortar en pedazos y convertir en vectores se le puede dar a un transformer. Texto, parches de imagen, franjas de espectrograma y tubelets de video: para cuando los ve la atención, todos son simplemente tokens.
      </Callout>
      <p>
        Los pedazos también cuestan lo mismo: espacio en la <strong>ventana de contexto</strong>. Una imagen o un minuto de audio pueden usar tantos tokens como varios párrafos de texto, y por eso aplican los mismos límites y precios.
        Para ver cómo se eligen los tokens de texto, consulta <ArticleLink slug="why-tokens">Por qué los modelos leen tokens</ArticleLink>; para ver qué les pasa a todos estos vectores una vez que están en la secuencia, consulta <ArticleLink slug="how-llms-work">Cómo un modelo de lenguaje convierte tus palabras en una respuesta</ArticleLink>.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://arxiv.org/abs/2010.11929", title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", source: "Dosovitskiy et al. · arXiv", note: "el artículo del Vision Transformer (en inglés)" },
  { href: "https://arxiv.org/abs/2304.08485", title: "Visual Instruction Tuning (LLaVA)", source: "Liu et al. · arXiv", note: "cómo unir un codificador de visión a un modelo de lenguaje (en inglés)" },
  { href: "https://arxiv.org/abs/2103.15691", title: "ViViT: A Video Vision Transformer", source: "Arnab et al. · arXiv", note: "en inglés" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Cómo ven las imágenes los modelos de IA?", a: "Un vision transformer corta la imagen en una cuadrícula de pequeños parches cuadrados, a menudo de 16×16 píxeles, aplana cada parche en una lista de números y lo proyecta en un vector del mismo tamaño que el embedding de una palabra. Luego el modelo lee los vectores de los parches como una secuencia, igual que los tokens de un texto." },
  { q: "¿Cuántos tokens ocupa una imagen?", a: "Depende del modelo y del tamaño de la imagen. Una imagen de 224×224 cortada en parches de 16×16 da 196 tokens de parche. Los modelos comerciales redimensionan o dividen en mosaicos las imágenes más grandes y cuentan los tokens por mosaico, así que una sola foto suele costar desde unos cientos hasta unos miles de tokens." },
  { q: "¿Cómo procesan el audio los modelos de lenguaje?", a: "El audio se corta en tramas cortas, normalmente de 20 a 25 milisegundos cada una, y casi siempre se convierte en un espectrograma que muestra cuánta energía hay en cada frecuencia. Cada trama, o un grupito de tramas, se convierte en un vector, así que unos segundos de voz se vuelven una secuencia de cientos de tokens." },
  { q: "¿Qué es un modelo multimodal?", a: "Un modelo multimodal puede recibir más de un tipo de datos, como texto, imágenes, audio o video, y a menudo también producir más de un tipo. Cada tipo de entrada se convierte en vectores del mismo tamaño, para que puedan estar en una sola secuencia y los procese el mismo transformer." },
];
