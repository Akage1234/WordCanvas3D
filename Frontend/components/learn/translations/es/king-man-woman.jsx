import { Fig, Parallelogram } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import s from "@/components/learn/learn.module.css";

const RESULTS = [
  ["GloVe 300D", "queen", "0.73"],
  ["FastText 300D", "queen", "0.77"],
  ["Word2Vec 300D", "royal", "0.51"],
];

export default function KingManWoman() {
  return (
    <>
      <p>
        Uno de los resultados más famosos de los embeddings de palabras es una cuenta: toma el vector de <code>king</code> (rey), réstale <code>man</code> (hombre), súmale <code>woman</code> (mujer), y la palabra más cercana al resultado es <code>queen</code> (reina).
        Suena a truco de magia. En realidad es una afirmación sobre direcciones en el espacio, y una vez que lo ves así, también puedes ver dónde funciona y dónde falla.
      </p>

      <h2>Las palabras como flechas</h2>
      <p>
        En un modelo de embeddings, cada palabra es una lista de números, aquí 300, llamada <strong>vector</strong>. Puedes imaginar esa lista como una flecha que va del origen (el punto donde todos los números son cero) hasta un punto.
        Sumar y restar flechas se hace un número a la vez: para calcular <code>king − man</code>, resta el primer número de <code>man</code> del primer número de <code>king</code>, luego el segundo, y así hasta llegar a 300.
      </p>
      <p>
        El resultado de una resta es también una flecha: la dirección en la que viajarías para ir de <code>man</code> a <code>king</code>.
        Si el modelo aprendió una noción coherente de “realeza”, entonces el viaje de <code>woman</code> a <code>queen</code> debería apuntar más o menos hacia el mismo lado.
      </p>
      <Fig caption="Una imagen simplificada en 2D. La analogía funciona cuando la flecha man → king y la flecha woman → queen son casi paralelas.">
        <Parallelogram label="Las flechas de man a king y de woman a queen son paralelas" royalty="realeza" gender="género" />
      </Fig>
      <p>
        Así que <code>king − man + woman</code> significa: empieza en <code>king</code>, quita la dirección “hombre”, agrega la dirección “mujer”. Si la geometría es limpia, caes cerca de <code>queen</code>.
        La misma idea se puede leer al revés, como “¿qué es a woman lo que king es a man?”.
      </p>

      <h2>Qué hace en realidad el Laboratorio de vectores</h2>
      <p>
        El Laboratorio tiene tres casillas, a, b y c, y calcula <code>a − b + c</code>. Por detrás:
      </p>
      <ul>
        <li>busca el vector completo de 300 números de cada una de tus tres palabras;</li>
        <li>hace la aritmética con los 300 números;</li>
        <li>compara el resultado con cada palabra que tiene cargada el modelo (10,000) usando la similitud coseno, que mide qué tanto apuntan dos flechas hacia el mismo lado;</li>
        <li>se salta tus tres palabras de entrada y muestra las palabras restantes más cercanas y su similitud.</li>
      </ul>
      <Fig caption="La palabra más cercana a king − man + woman en cada modelo, con su similitud coseno.">
        <table className={s.table}>
          <thead><tr><th>Modelo</th><th>Resultado</th><th>Similitud</th></tr></thead>
          <tbody>
            {RESULTS.map(([m, w, v]) => <tr key={m}><td>{m}</td><td>{w}</td><td>{v}</td></tr>)}
          </tbody>
        </table>
      </Fig>
      <p>
        GloVe y FastText caen los dos en <code>queen</code>. Word2Vec no, y la razón es bastante mundana: su vocabulario distingue mayúsculas de minúsculas,
        y entre las 10,000 palabras cargadas aquí solo está <code>Queen</code> con mayúscula.
        Ese vector obtiene 0.44, por debajo de <code>royal</code> (real, de la realeza).
      </p>

      <h2>La letra pequeña</h2>
      <p>
        Ese paso de “se salta tus tres palabras de entrada” importa más de lo que parece. En los datos de GloVe, el vector más cercano a <code>king − man + woman</code> es en realidad el propio <code>king</code>
        (similitud 0.82), con <code>queen</code> en segundo lugar. Restar <code>man</code> y sumar <code>woman</code> mueve la flecha solo un poco, así que se queda más cerca de donde empezó.
        Casi todas las herramientas de analogías excluyen las entradas por esta razón. El famoso resultado es real, pero un poco menos espectacular de lo que suena.
      </p>
      <p>
        Las flechas en 3D del lienzo son otra simplificación: son una vista aplanada de vectores de 300 dimensiones, así que los ángulos y las longitudes en pantalla son solo aproximados.
        La imagen es una pista; la respuesta sale del cálculo completo con los 300 números.
      </p>

      <h2>Más analogías para probar</h2>
      <p>Todas estas funcionan con GloVe, el modelo por defecto del Laboratorio:</p>
      <ul>
        <li><code>paris − france + italy</code> → <code>rome</code> (capitales)</li>
        <li><code>france − paris + tokyo</code> → <code>japan</code> (la misma relación, al revés)</li>
        <li><code>walking − walk + swim</code> → <code>swimming</code> (formas verbales: caminando − caminar + nadar → nadando)</li>
        <li><code>bigger − big + small</code> → <code>smaller</code> (más pequeño), con <code>larger</code> (más grande) en un segundo lugar muy cercano</li>
      </ul>
      <p>
        Esa última muestra un fallo común. <code>smaller</code> y <code>larger</code> aparecen en frases casi idénticas, así que el modelo los mantiene muy juntos.
        Los embeddings son buenos para “el mismo tipo de palabra” y más flojos para “lo contrario de”.
      </p>

      <h2>Cómo leer el resultado</h2>
      <p>
        La similitud que muestra el Laboratorio es la similitud coseno: 1 sería una coincidencia perfecta en dirección. No es una probabilidad ni una medida de confianza.
        Solo dice qué tanto apunta la flecha del resultado hacia cada palabra candidata. Un número bajo, como el 0.51 de Word2Vec, significa que el cálculo cayó en una zona poco poblada y que ni siquiera la palabra más cercana está muy cerca.
      </p>
      <p>
        También puedes saltarte el cálculo y solo graficar palabras. La casilla de palabras acepta hasta 50 palabras y dibuja cada una como una flecha, una forma rápida de comparar un conjunto pequeño como <code>man woman king queen</code>.
      </p>

      <h2>Por qué funciona y qué refleja</h2>
      <p>
        Nadie programó una dirección de “realeza” o de “género” en estos modelos. Surgieron porque el texto de entrenamiento usa <code>king</code> y <code>queen</code> de formas paralelas,
        igual que <code>man</code> y <code>woman</code>. La geometría es un resumen comprimido de cómo escribe la gente.
        Por qué las direcciones de un embedding llevan significado se explora en <ArticleLink slug="latent-space">El espacio latente: el significado oculto en los números</ArticleLink>.
      </p>
      <p>
        Eso tiene dos caras. Los investigadores han mostrado que la misma aritmética saca a la luz estereotipos del texto de entrenamiento, por ejemplo al asociar ciertos trabajos con más fuerza a un género.
        Cuando una analogía da una respuesta sorprendente, vale la pena preguntarse qué hay en el texto de origen que pudo haberla producido.
      </p>
    </>
  );
}

export const faq = [
  { q: "¿Qué significa king − man + woman = queen?", a: "Es un resultado famoso de los embeddings de palabras. Tomar el vector de king (rey), restarle man (hombre) y sumarle woman (mujer) da un punto cuya palabra más cercana suele ser queen (reina). Muestra que algunas relaciones, como la de masculino a femenino, aparecen como direcciones coherentes en el espacio de embeddings." },
  { q: "¿Las analogías de palabras siempre funcionan?", a: "No. Funcionan bien con algunas relaciones, como el género, las capitales y los tiempos verbales, y mal con muchas otras. Además, los resultados casi siempre se reportan excluyendo las palabras de entrada, porque el vector más cercano suele ser una de ellas, lo que hace que el método parezca más confiable de lo que es." },
  { q: "¿Cómo se calcula la respuesta de una analogía?", a: "Los tres vectores se combinan como a − b + c, y el resultado se compara con cada vector de palabra usando la similitud coseno. Las palabras más cercanas, excluyendo las tres de entrada, son las respuestas. El Laboratorio de vectores de WordCanvas3D muestra este cálculo paso a paso." },
  { q: "¿La aritmética de vectores puede revelar sesgos?", a: "Sí. La misma aritmética puede sacar a la luz estereotipos aprendidos del texto de entrenamiento, por ejemplo al asociar ciertas profesiones con más fuerza a un género. Estos resultados reflejan patrones en cómo escribe la gente, y por eso los embeddings suelen evaluarse y ajustarse contra los sesgos antes de usarse." },
];
