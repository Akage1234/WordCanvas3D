import { Fig, Scatter, PCA_POINTS, UMAP_POINTS } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import s from "@/components/learn/learn.module.css";

const SCATTER_LABEL = "Gráfica de dispersión de cuatro grupos de colores";

export default function PcaVsUmap() {
  return (
    <>
      <p>
        Cada palabra de la página de Embeddings es en realidad una lista de 300 números, un punto en un espacio de 300 dimensiones. Las pantallas tienen dos dimensiones y nuestra intuición maneja tres.
        Para poder dibujar las palabras, el sitio tiene que reducir 300 números a 3. Esto se llama <strong>reducción de dimensionalidad</strong>, y la página ofrece dos maneras de hacerlo: <strong>PCA</strong> y <strong>UMAP</strong>.
      </p>
      <p>
        Ninguna es “la correcta”. Desechar 297 dimensiones siempre pierde algo. Los dos métodos simplemente eligen conservar cosas distintas.
        Esta guía cubre las dos opciones de la página de Embeddings; <ArticleLink slug="dimensionality-reduction">Ver muchas dimensiones</ArticleLink> explica más a fondo la familia completa, incluido t-SNE.
      </p>

      <h2>PCA: encontrar las direcciones más amplias</h2>
      <p>
        El <strong>análisis de componentes principales</strong> (PCA) busca la dirección en la que los puntos están más dispersos. Esa se vuelve el primer eje.
        Luego encuentra la siguiente dirección más dispersa en ángulo recto con la primera, y así sucesivamente. Para obtener una vista en 3D, se queda con las tres primeras direcciones y descarta el resto.
      </p>
      <p>
        Piensa en fotografiar un objeto plano, como un libro. Obtienes más información si lo fotografías de frente, donde su forma es más ancha, y no de canto.
        PCA elige el ángulo de cámara que muestra la mayor dispersión. Matemáticamente es solo una rotación seguida de descartar ejes (una <strong>proyección</strong>, como una sombra sobre una pared), así que tiene propiedades útiles:
      </p>
      <ul>
        <li>Es determinista: los mismos datos siempre dan la misma imagen.</li>
        <li>Es lineal, así que las relaciones en línea recta del espacio original siguen siendo rectas.</li>
        <li>Las distancias grandes se conservan más o menos: lo que está lejos en la gráfica de verdad está lejos en los datos.</li>
      </ul>
      <p>
        Su punto débil es todo lo que tiene que dejar fuera. Los embeddings de palabras reparten su información en muchas direcciones.
        En los 10,000 vectores de GloVe que trae este sitio, las tres primeras direcciones capturan solo alrededor del 9% de la dispersión total; hacen falta unas 54 direcciones para llegar a la mitad.
        Por eso una vista de PCA suele verse como una gran nube, con grupos encimados en el centro. Dos palabras pueden quedar juntas en pantalla sin parecerse en nada.
      </p>

      <h2>UMAP: mantener juntos a los vecinos</h2>
      <p>
        <strong>UMAP</strong> (Uniform Manifold Approximation and Projection, 2018) tiene otro enfoque. En lugar de conservar la dispersión general, intenta conservar los <em>vecindarios</em>.
      </p>
      <p>
        Primero encuentra los vecinos más cercanos de cada palabra en el espacio completo de 300 dimensiones y construye un grafo que los conecta.
        Luego coloca las palabras en 3D y las va empujando hasta que los vecinos en 3D se parecen lo más posible a los originales: los vecinos se atraen y los que no lo son se repelen.
      </p>
      <Fig caption="Una ilustración, no datos reales: los mismos cuatro grupos tal como suelen mostrarlos PCA y UMAP. PCA conserva la dispersión general, así que los grupos se enciman. UMAP mantiene juntos a los vecinos, así que los grupos se separan en islas.">
        <div className={s.pair}>
          <div><h3>PCA</h3><Scatter points={PCA_POINTS} label={SCATTER_LABEL} /></div>
          <div><h3>UMAP</h3><Scatter points={UMAP_POINTS} label={SCATTER_LABEL} /></div>
        </div>
      </Fig>
      <p>
        El resultado suele mostrar clústeres claros y compactos: los números en una isla, los nombres de lugares en otra. Eso hace que las vistas de UMAP sean más fáciles de explorar.
        Pero esa claridad viene con reglas para leerlas:
      </p>
      <ul>
        <li><strong>Las distancias entre clústeres significan poco.</strong> Dos islas muy separadas no están necesariamente menos relacionadas que dos islas una al lado de la otra.</li>
        <li><strong>El tamaño de los clústeres significa poco.</strong> UMAP tiende a igualar la densidad, así que un grupo grande y disperso y uno pequeño y compacto pueden verse parecidos.</li>
        <li><strong>Cada ejecución es distinta.</strong> UMAP parte de una disposición aleatoria, así que volver a correrlo puede girar, voltear o reacomodar las islas. Las vistas de este sitio se calculan de antemano, así que no cambian entre visitas.</li>
      </ul>

      <h2>Lado a lado</h2>
      <Fig caption="Cómo se comparan los dos métodos.">
        <div className={s.scroll}>
          <table className={s.table} style={{ minWidth: 440 }}>
            <thead><tr><th></th><th>PCA</th><th>UMAP</th></tr></thead>
            <tbody>
              <tr><td>Conserva</td><td>la dispersión general</td><td>los vecinos locales</td></tr>
              <tr><td>Método</td><td>lineal (rotación)</td><td>no lineal (grafo)</td></tr>
              <tr><td>Mismo resultado en cada ejecución</td><td>sí</td><td>no garantizado</td></tr>
              <tr><td>Los clústeres se ven</td><td>encimados</td><td>separados</td></tr>
              <tr><td>Distancias confiables</td><td>las grandes, más o menos</td><td>solo las pequeñas</td></tr>
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Cómo leer la página de Embeddings</h2>
      <p>
        En la página de Embeddings, el selector de <strong>Reducción de dimensionalidad</strong> cambia entre los dos. Prueba el mismo modelo y la misma cantidad de palabras en ambos y compara.
      </p>
      <ul>
        <li>Los colores salen de los ID de clúster guardados con cada archivo de datos. Se calculan por separado para cada vista, así que un color en PCA no significa el mismo grupo que ese color en UMAP.</li>
        <li>La propia página advierte que la distancia en la vista 3D no es la puntuación de similitud original. Para la similitud real, lo que cuenta son los 300 números completos.</li>
        <li>Busca una palabra y mira sus vecinos en las dos vistas. Los vecinos que aparecen en ambas son una buena señal de que la relación es real y no un efecto de la proyección.</li>
      </ul>
      <p>
        Un buen hábito es usar UMAP para encontrar grupos interesantes y PCA para comprobar que el panorama general tiene sentido.
      </p>
    </>
  );
}

export const faq = [
  { q: "¿Debo usar PCA o UMAP para visualizar embeddings?", a: "Usa PCA para una vista rápida y repetible de la forma general y de las direcciones principales de variación. Usa UMAP cuando te importa qué puntos son vecinos y quieres ver clústeres. Mirar los dos con los mismos datos suele ser lo más informativo." },
  { q: "¿Por qué UMAP da una imagen distinta cada vez?", a: "UMAP parte de una disposición aleatoria y la optimiza, así que distintas ejecuciones o ajustes pueden producir acomodos distintos, sobre todo entre clústeres. Fijar la semilla aleatoria lo hace repetible. PCA es determinista y da el mismo resultado cada vez con los mismos datos." },
  { q: "¿Qué conserva PCA y qué pierde?", a: "PCA conserva las pocas direcciones en línea recta en las que los datos se dispersan más, así que sobreviven las distancias grandes y la estructura general. Pierde todo lo que hay en las direcciones restantes, lo que puede aplastar grupos pequeños distintos uno encima del otro." },
  { q: "¿Cómo se lee una gráfica de UMAP?", a: "Fíate de qué puntos están cerca unos de otros: un grupo compacto suele compartir algo real. Ten cuidado con el tamaño de los clústeres y las distancias entre ellos, que UMAP no conserva de forma confiable. Pasa el cursor sobre los puntos y revisa las palabras reales antes de sacar conclusiones." },
];
