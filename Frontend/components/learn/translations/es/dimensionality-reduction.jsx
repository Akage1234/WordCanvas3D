import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { ArticleLink, Callout, Fig } from "@/components/learn/kit";
import { SwissRoll } from "./dimensionality-reduction.figures";
import s from "@/components/learn/articles/dimensionality-reduction.module.css";
import l from "@/components/learn/learn.module.css";

const [RED, TEAL, SKY, YELLOW] = CLUSTER_COLORS;

function Shadow() {
  return (
    <Fig caption="Ilustrativo. Proyectar es como proyectar una sombra. Los puntos A y B están lejos uno del otro en 3D, pero están sobre la misma línea de visión, así que sus sombras caen en el mismo lugar. Toda proyección a menos dimensiones pierde algunas diferencias como esta.">
      <svg viewBox="0 0 420 200" className={l.big} role="img" aria-label="Vista lateral: una luz a la izquierda, dos puntos A y B a distintas profundidades sobre una misma línea, y una pantalla a la derecha donde las dos sombras caen en un mismo lugar.">
        <circle cx="30" cy="100" r="10" fill={YELLOW} />
        <text x="30" y="135" textAnchor="middle" className={s.dimText}>luz</text>
        <line x1="30" y1="100" x2="360" y2="40" stroke="#ffffff40" strokeDasharray="4 4" />
        <line x1="360" y1="15" x2="360" y2="185" stroke="#ffffff66" strokeWidth="3" />
        <text x="372" y="190" className={s.dimText}>2D</text>
        <circle cx="140" cy="80" r="7" fill={TEAL} />
        <text x="140" y="68" textAnchor="middle" className={s.label}>A</text>
        <circle cx="270" cy="56.4" r="7" fill={RED} />
        <text x="270" y="44" textAnchor="middle" className={s.label}>B</text>
        <circle cx="360" cy="40" r="6" fill="#fff" />
        <text x="352" y="30" textAnchor="end" className={s.label}>A y B</text>
      </svg>
    </Fig>
  );
}

// Illustrative toy data, computed offline with scikit-learn: three clusters of 50 points each in 10 dimensions.
// Red: very tight (spread 0.5). Teal: wide (spread 3), 10 units from red. Yellow: medium (spread 1.5), 60 units from red.
// pca: PCA to 2D; p2, p5, p30: t-SNE at perplexity 2, 5 and 30 (same random seed). Each panel scaled to -1..1.
const TOY = {"label":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],"pca":[-0.56,0.01,-0.57,0.01,-0.57,0.0,-0.54,-0.01,-0.58,0.01,-0.56,0.01,-0.56,0.01,-0.55,-0.01,-0.56,0.01,-0.56,-0.01,-0.57,-0.01,-0.57,-0.0,-0.55,-0.01,-0.57,-0.01,-0.58,0.01,-0.56,0.01,-0.56,0.01,-0.57,-0.0,-0.56,-0.02,-0.57,0.02,-0.54,0.01,-0.56,0.0,-0.57,0.0,-0.56,0.01,-0.56,0.0,-0.57,0.01,-0.58,0.01,-0.57,-0.01,-0.56,0.0,-0.58,0.01,-0.57,0.01,-0.57,-0.01,-0.57,-0.01,-0.55,0.02,-0.58,-0.0,-0.57,0.01,-0.56,-0.0,-0.54,0.01,-0.56,0.01,-0.56,-0.0,-0.58,0.02,-0.59,0.01,-0.57,0.0,-0.55,0.01,-0.57,-0.0,-0.56,0.02,-0.54,0.01,-0.56,0.02,-0.57,0.01,-0.58,-0.01,-0.42,0.03,-0.41,0.14,-0.25,-0.03,-0.41,0.07,-0.32,-0.07,-0.4,0.09,-0.38,0.11,-0.29,-0.21,-0.27,-0.11,-0.55,0.14,-0.39,0.01,-0.16,0.12,-0.19,0.18,-0.35,-0.1,-0.29,-0.21,-0.31,0.01,-0.33,0.17,-0.48,0.02,-0.39,0.01,-0.4,-0.11,-0.36,-0.09,-0.4,-0.04,-0.25,-0.13,-0.23,0.05,-0.33,0.06,-0.41,-0.07,-0.36,0.17,-0.25,-0.11,-0.34,-0.08,-0.41,-0.15,-0.37,-0.06,-0.42,-0.04,-0.33,0.0,-0.31,-0.09,-0.41,-0.02,-0.36,0.08,-0.04,0.01,-0.22,-0.01,-0.42,0.08,-0.3,-0.07,-0.41,-0.19,-0.42,-0.07,-0.31,0.18,-0.34,0.06,-0.26,0.07,-0.47,0.1,-0.36,-0.04,-0.41,0.1,-0.38,-0.07,-0.25,-0.09,0.91,-0.03,0.87,-0.01,1.0,0.0,0.89,0.01,0.9,0.05,0.86,-0.02,0.85,0.01,0.95,0.0,0.9,-0.02,0.9,0.01,0.89,-0.03,0.98,-0.02,0.92,0.02,0.87,-0.01,0.9,0.03,0.91,-0.04,0.87,0.03,0.84,-0.04,1.0,0.06,0.88,-0.09,0.89,0.03,0.88,0.05,0.9,-0.06,0.97,0.05,0.86,-0.01,0.93,0.04,0.93,0.01,0.91,-0.0,0.97,0.01,0.91,0.02,0.91,-0.01,0.94,0.02,0.92,0.02,0.89,-0.01,0.97,-0.01,0.85,0.02,0.95,-0.04,0.99,0.01,0.95,0.03,0.88,0.0,0.92,0.02,0.84,-0.02,0.89,0.04,0.86,-0.07,0.9,-0.06,0.89,0.08,0.94,0.0,0.91,-0.02,0.85,0.01,0.87,0.01],"p2":[-0.88,-0.31,-0.28,-0.17,-0.64,-0.28,-0.42,-0.3,-0.26,-0.32,-0.6,-0.24,-0.2,-0.14,-0.41,-0.29,-0.9,-0.34,-0.67,-0.18,-0.55,0.09,-0.31,-0.09,-0.35,-0.02,-0.61,0.03,-0.61,0.02,-0.25,-0.18,-0.23,-0.39,-0.28,-0.26,-0.35,-0.05,-0.64,0.01,-0.37,0.1,-0.64,-0.25,-0.29,-0.09,-0.91,-0.29,-0.85,-0.34,-0.86,-0.31,-0.63,0.05,-0.36,-0.06,-0.28,-0.16,-0.54,0.07,-0.25,-0.34,-0.27,-0.08,-0.65,-0.25,-0.18,-0.13,-0.31,-0.18,-0.27,-0.38,-0.28,-0.24,-0.74,-0.15,-0.52,0.06,-0.69,-0.17,-0.5,0.05,-0.34,-0.19,-0.24,-0.36,-0.56,-0.24,-0.19,-0.28,-0.71,-0.16,-0.55,-0.24,-0.85,-0.29,-0.59,-0.02,-0.21,-0.35,0.03,-0.02,0.26,0.75,-0.01,0.54,-0.04,0.48,-0.46,0.48,0.09,0.39,0.05,0.71,-0.46,0.42,-0.35,0.19,-0.93,-0.27,-0.32,0.17,0.17,0.46,0.03,0.51,-0.04,0.52,-0.45,0.42,0.31,0.75,0.24,0.75,0.01,0.03,-0.18,0.25,-0.34,0.17,0.15,0.38,-0.37,0.35,-0.46,0.45,0.32,0.78,0.08,0.39,-0.36,0.34,0.13,0.71,0.32,0.72,-0.39,0.37,-0.17,0.55,0.14,0.39,-0.35,0.12,-0.02,0.51,-0.26,0.5,-0.19,0.24,0.04,0.7,0.18,0.48,0.16,0.45,-0.01,0.08,-0.23,0.53,-0.16,0.56,0.02,0.0,0.14,0.71,0.3,0.75,0.0,0.5,0.0,0.05,-0.25,0.51,0.02,0.47,-0.01,0.09,-0.42,0.4,0.47,-0.15,0.99,0.1,0.72,0.15,0.25,-0.5,0.49,-0.09,0.4,-0.35,0.64,-0.49,0.58,-0.05,0.28,-0.55,0.51,-0.15,0.28,-0.53,0.72,0.16,0.75,-0.15,0.31,-0.52,0.44,-0.25,0.27,-0.61,0.65,-0.48,0.57,-0.55,0.49,-0.07,0.54,-0.53,0.51,-0.13,0.73,-0.11,0.54,-0.58,0.54,-0.11,0.65,-0.62,0.65,-0.1,0.63,-0.03,0.4,-0.34,0.73,0.18,0.43,-0.27,0.26,-0.51,0.75,-0.16,0.6,-0.04,1.0,0.12,0.66,-0.01,0.51,-0.17,0.77,-0.16,0.24,-0.48,0.61,0.01,0.47,-0.26,0.43,-0.22,0.58,-0.56,0.66,-0.08,0.28,-0.58,0.52,-0.54,0.55,-0.16,0.67,-0.0,0.98,0.09,0.64,-0.61,0.74,-0.09],"p5":[-0.42,0.1,-0.69,-0.05,-0.83,-0.18,-0.72,-0.17,-0.82,0.01,-0.54,-0.14,-0.41,-0.07,-0.72,-0.15,-0.47,-0.25,-0.48,-0.13,-0.67,0.24,-0.63,-0.01,-0.52,-0.31,-0.57,0.21,-0.59,0.19,-0.65,-0.09,-0.9,0.05,-0.82,-0.08,-0.57,-0.32,-0.47,0.22,-0.64,0.09,-0.5,-0.08,-0.63,0.03,-0.39,0.14,-0.39,0.09,-0.44,0.1,-0.53,0.23,-0.6,-0.33,-0.69,-0.08,-0.65,0.21,-0.84,0.04,-0.58,0.01,-0.51,-0.06,-0.38,-0.07,-0.73,-0.01,-0.88,0.11,-0.77,-0.07,-0.38,-0.19,-0.65,0.17,-0.45,-0.12,-0.71,0.16,-0.75,0.03,-0.86,0.06,-0.57,-0.17,-0.9,-0.03,-0.41,-0.15,-0.6,-0.18,-0.45,0.06,-0.55,0.13,-0.84,0.12,-0.09,-0.14,0.34,-0.73,-0.01,-0.85,-0.02,-0.78,0.19,-0.42,0.17,-0.88,-0.12,-0.75,0.14,-0.36,-0.02,-0.54,-0.39,0.19,-0.09,-0.51,0.09,-0.98,0.03,-0.92,0.06,-0.79,0.12,-0.37,0.34,-0.64,0.37,-0.75,-0.16,-0.19,-0.19,-0.6,-0.06,-0.51,0.2,-0.98,0.03,-0.46,0.16,-0.4,0.32,-0.62,0.18,-0.86,0.02,-0.49,0.27,-0.8,0.37,-0.6,0.06,-0.42,0.1,-0.67,0.18,-0.96,-0.08,-0.44,0.04,-0.82,0.11,-0.59,-0.19,-0.58,-0.1,-0.76,0.05,-1.0,0.11,-0.98,-0.18,-0.26,0.16,-0.63,0.09,-0.68,-0.12,-0.16,0.29,-0.79,0.34,-0.66,0.05,-0.85,-0.18,-0.21,0.13,-0.6,0.1,-0.85,-0.18,-0.29,0.08,-0.38,0.78,0.48,0.32,0.6,0.43,0.38,0.57,0.77,0.63,0.61,0.74,0.77,0.26,0.8,0.59,0.52,0.56,0.85,0.69,0.55,0.57,0.83,0.42,0.36,0.58,0.36,0.6,0.81,0.76,0.67,0.61,0.93,0.25,0.78,0.32,0.82,0.58,0.63,0.37,0.89,0.66,0.56,0.66,0.4,0.4,0.84,0.62,0.56,0.37,0.7,0.81,0.58,0.56,0.44,0.75,0.76,0.38,0.36,0.78,0.71,0.56,0.8,0.56,0.34,0.57,0.5,0.3,0.57,0.51,0.43,0.71,0.52,0.57,0.31,0.56,0.71,0.64,0.36,0.71,0.67,0.81,0.66,0.33,0.8,0.62,0.43,0.58,0.89,0.4,0.88,0.77,0.54,0.49,0.44,0.33,0.62,0.36,0.72,0.7,0.41],"p30":[-0.36,0.16,-0.41,0.17,-0.48,0.23,-0.49,0.15,-0.41,0.2,-0.44,0.13,-0.39,0.12,-0.47,0.16,-0.36,0.15,-0.42,0.12,-0.4,0.23,-0.41,0.16,-0.34,0.08,-0.39,0.19,-0.36,0.2,-0.36,0.1,-0.45,0.17,-0.43,0.22,-0.51,0.15,-0.31,0.19,-0.4,0.07,-0.41,0.14,-0.38,0.15,-0.34,0.14,-0.34,0.13,-0.37,0.17,-0.35,0.2,-0.52,0.16,-0.45,0.15,-0.37,0.23,-0.42,0.19,-0.38,0.12,-0.4,0.14,-0.39,0.09,-0.4,0.19,-0.46,0.2,-0.43,0.19,-0.46,0.09,-0.37,0.22,-0.41,0.12,-0.38,0.26,-0.39,0.25,-0.43,0.19,-0.46,0.12,-0.44,0.25,-0.42,0.1,-0.47,0.13,-0.36,0.16,-0.48,0.2,-0.43,0.23,-0.4,-0.0,-0.53,-0.16,-0.49,-0.09,-0.45,0.02,-0.5,-0.05,-0.41,-0.08,-0.47,-0.01,-0.56,-0.03,-0.58,0.01,-0.29,0.16,-0.56,0.05,-0.45,-0.14,-0.47,-0.13,-0.49,-0.06,-0.56,-0.03,-0.56,-0.12,-0.54,-0.17,-0.36,0.02,-0.6,0.09,-0.56,0.05,-0.37,-0.1,-0.53,0.02,-0.54,-0.04,-0.56,-0.12,-0.42,-0.08,-0.55,0.03,-0.5,-0.15,-0.58,-0.11,-0.53,-0.02,-0.62,-0.04,-0.39,-0.1,-0.51,0.03,-0.47,-0.07,-0.6,-0.06,-0.6,0.09,-0.47,-0.01,-0.45,-0.14,-0.43,-0.12,-0.33,-0.01,-0.61,-0.08,-0.61,-0.04,-0.39,0.0,-0.5,-0.15,-0.56,-0.12,-0.46,-0.08,-0.34,0.01,-0.59,-0.06,-0.44,-0.07,-0.33,-0.03,-0.54,-0.04,0.81,-0.13,0.98,-0.07,0.84,-0.1,0.94,-0.17,0.91,-0.2,0.96,-0.12,0.92,-0.04,0.89,-0.14,0.95,-0.14,0.87,-0.15,0.95,-0.14,0.83,-0.09,0.88,-0.09,0.94,-0.11,0.9,-0.16,1.0,-0.12,0.9,-0.04,0.92,-0.05,0.93,-0.22,0.93,-0.1,0.88,-0.15,0.88,-0.1,0.91,-0.09,0.88,-0.18,0.94,-0.08,0.83,-0.14,0.89,-0.09,0.97,-0.13,0.81,-0.1,0.92,-0.16,0.94,-0.15,0.85,-0.05,0.89,-0.12,0.99,-0.06,0.87,-0.08,0.86,-0.14,0.87,-0.05,0.95,-0.21,0.86,-0.09,0.9,-0.18,0.88,-0.22,0.92,-0.06,0.89,-0.09,0.98,-0.15,0.93,-0.13,0.82,-0.15,0.86,-0.11,0.96,-0.06,0.94,-0.07,0.85,-0.17]};
const TOY_COLORS = [RED, TEAL, YELLOW];
const PANELS = [["pca", "PCA (como referencia)"], ["p2", "t-SNE, perplejidad 2"], ["p5", "t-SNE, perplejidad 5"], ["p30", "t-SNE, perplejidad 30"]];

function Perplexity() {
  return (
    <Fig caption="Datos ilustrativos, ejecuciones reales de t-SNE. Tres grupos en 10 dimensiones: el rojo es muy compacto, el verde azulado es seis veces más amplio y está cerca del rojo, el amarillo está lejos de los dos. PCA (una proyección recta) conserva esas diferencias de tamaño y distancia. t-SNE hace que los grupos parezcan de tamaño parecido, y qué tan separados se ven depende del ajuste de perplejidad.">
      <div className={s.multi}>
        {PANELS.map(([k, name]) => (
          <div key={k}>
            <svg viewBox="-1.15 -1.15 2.3 2.3" role="img" aria-label={`${name}: tres grupos de puntos de colores.`}>
              {TOY.label.map((c, i) => <circle key={i} cx={TOY[k][2 * i]} cy={-TOY[k][2 * i + 1]} r="0.035" fill={TOY_COLORS[c]} />)}
            </svg>
            <p>{name}</p>
          </div>
        ))}
      </div>
    </Fig>
  );
}

const TABLE = [
  ["PCA", "Lineal", "La dispersión general; las distancias grandes", "Formas curvas; grupos pequeños escondidos entre la multitud", "Rápido"],
  ["t-SNE", "No lineal", "Los vecinos cercanos de cada punto", "El tamaño de los clústeres; las distancias entre clústeres", "Más lento con muchos datos"],
  ["UMAP", "No lineal", "Los vecinos cercanos, más algo de la disposición a gran escala", "Densidades y distancias exactas", "Rápido"],
  ["Isomap", "No lineal", "Distancias medidas sobre la superficie de los datos", "Falla si hay vecinos conectados a través de huecos; datos con ruido", "Medio"],
  ["LDA", "Lineal, usa etiquetas", "La separación entre clases conocidas", "Todo lo que las etiquetas no cubren", "Rápido"],
];

export default function DimensionalityReduction() {
  return (
    <>
      <p>
        Los embeddings de palabras tienen cientos de números por palabra; los vectores dentro de los modelos de lenguaje grandes tienen miles. Nuestros ojos manejan dos dimensiones en una pantalla y tres como mucho.
        La <strong> reducción de dimensionalidad</strong> es la familia de métodos que aplastan muchas dimensiones en dos o tres para que podamos mirar. Es una de las herramientas más útiles para entender
        los embeddings, y una de las más fáciles de malinterpretar. Este artículo explica los métodos principales, qué conserva cada uno y qué desecha cada uno sin avisar.
      </p>

      <h2>Por qué toda imagen tiene que mentir un poco</h2>
      <p>
        Pasar de 300 números a 2 significa descartar información. No hay forma de evitarlo: una imagen plana simplemente tiene menos lugares donde poner las cosas.
        Una foto de un cuarto pierde la profundidad; un mapamundi estira Groenlandia. Cada método decide <em>qué</em> relaciones conservar.
      </p>
      <Shadow />
      <p>
        Así que la pregunta útil nunca es “¿qué método es el correcto?”, sino “¿qué intentó conservar este método y a qué renunció?”.
      </p>

      <h2>Una forma de prueba: el rollo suizo</h2>
      <p>
        Para comparar métodos, ayuda usar datos de los que conocemos la respuesta correcta. Una prueba clásica es el <strong>rollo suizo</strong>: una hoja rectangular plana, enrollada en espiral en 3D.
        La estructura real de los puntos es bidimensional (una posición a lo largo de la hoja y otra a lo ancho), pero el rollo la esconde.
        Un método que de verdad entendiera los datos lo desenrollaría. El color sigue la posición a lo largo de la hoja, así que una buena imagen en 2D mantiene los colores en orden.
      </p>
      <Fig caption="Datos ilustrativos (700 puntos). PCA, t-SNE, Isomap y LDA son ejecuciones reales de scikit-learn; la vista de UMAP sale de una pequeña reimplementación del algoritmo UMAP, así que se parece a la de la biblioteca oficial, pero no es idéntica. Gira el rollo en 3D con el control deslizante y luego cambia de método para ver el resultado en 2D de cada uno. Los puntos se deslizan de una disposición a la siguiente para que puedas seguirlos.">
        <SwissRoll />
      </Fig>
      <p>Ten presente esta imagen mientras repasamos los métodos uno por uno.</p>

      <h2>PCA: las direcciones más amplias</h2>
      <p>
        El <strong>análisis de componentes principales</strong> (PCA) encuentra la dirección en la que los datos están más dispersos y la llama primer componente principal.
        El segundo es la dirección más dispersa en ángulo recto con la primera, y así sucesivamente. Quedarse con los dos primeros y descartar el resto da una imagen en 2D.
        Geométricamente es una rotación seguida de una sombra: PCA elige el ángulo de cámara que muestra la mayor dispersión.
      </p>
      <p>
        PCA es <strong>lineal</strong>: solo puede girar y aplanar, nunca doblar. Eso lo hace rápido, predecible (los mismos datos siempre dan la misma imagen) y honesto con las distancias grandes.
        También significa que no puede desenrollar el rollo suizo; solo lo fotografía desde el lado donde se ve más grande.
        En los embeddings de palabras, donde el significado está repartido en muchas direcciones, los dos primeros componentes a menudo capturan solo una pequeña parte de la dispersión total, así que las imágenes de palabras con PCA suelen verse como una gran nube encimada.
      </p>

      <h2>t-SNE: mantener juntos a los vecinos</h2>
      <p>
        <strong>t-SNE</strong> (t-distributed stochastic neighbour embedding, 2008) renuncia a las distancias grandes y se concentra en los vecindarios. Para cada punto se pregunta, en el espacio original,
        “¿qué otros puntos son mis vecinos cercanos, y qué tan cerca están?”. Luego parte de una disposición en 2D aleatoria o aproximada y va moviendo los puntos, paso a paso,
        hasta que los vecinos en 2D de cada punto se parecen lo más posible a sus vecinos originales.
      </p>
      <p>
        Eso hace que t-SNE sea muy bueno para revelar clústeres. También produce tres ilusiones muy conocidas:
      </p>
      <ul>
        <li><strong>El tamaño de los clústeres no significa nada.</strong> t-SNE se adapta a la densidad local, así que un grupo compacto y uno disperso terminan viéndose más o menos del mismo tamaño.</li>
        <li><strong>Las distancias entre clústeres significan poco.</strong> Dos clústeres muy separados en la gráfica pueden estar o no estar lejos en los datos.</li>
        <li><strong>Los ajustes cambian la imagen.</strong> El control principal, la <strong>perplejidad</strong>, es más o menos a cuántos vecinos les presta atención cada punto. Los valores típicos van de 5 a 50.</li>
      </ul>
      <Perplexity />
      <p>
        t-SNE además es aleatorio: córrelo dos veces con semillas distintas y la imagen puede cambiar, aunque los vecindarios sean parecidos.
      </p>

      <h2>UMAP: objetivo parecido, más rápido, un poco más global</h2>
      <p>
        <strong>UMAP</strong> (uniform manifold approximation and projection, 2018) sigue el mismo plan básico: construir un grafo que conecte cada punto con sus vecinos más cercanos y luego encontrar una disposición en 2D que mantenga intacto ese grafo.
        Sus matemáticas son distintas y, en la práctica, es mucho más rápido con conjuntos de datos grandes, así que se volvió una opción habitual por defecto para los embeddings.
      </p>
      <p>
        UMAP tiende a conservar algo más de la disposición a gran escala que t-SNE: los grupos relacionados suelen quedar más cerca entre sí. Pero sigue siendo un método de vecindarios, así que aplica la misma precaución:
        las distancias entre clústeres y el tamaño de cada clúster no son confiables. Sus dos ajustes principales son el número de vecinos (los valores pequeños se fijan en el detalle fino; los grandes, en el panorama general)
        y una distancia mínima que controla qué tan apretados quedan los puntos.
      </p>

      <h2>Dos más: Isomap y LDA</h2>
      <p>
        <strong>Isomap</strong> (2000) también construye un grafo de vecinos más cercanos, pero luego mide la distancia entre dos puntos como el camino más corto a través de ese grafo, como caminar por la superficie
        en lugar de hacer un túnel por el aire. Estas se llaman distancias <strong>geodésicas</strong>. Después acomoda los puntos para que esas distancias se conserven. Con una forma limpia como el rollo suizo funciona de maravilla;
        con datos con ruido, unas cuantas conexiones equivocadas (“cortocircuitos” entre capas) pueden arruinarlo.
      </p>
      <p>
        <strong>LDA</strong> aquí significa <strong>análisis discriminante lineal</strong>. A diferencia de todo lo anterior, es <strong>supervisado</strong>: le das una etiqueta para cada punto (por ejemplo, el tema de cada palabra)
        y encuentra la proyección plana que mejor separa esas etiquetas. Es útil cuando ya conoces los grupos y quieres ver qué tan separables son.
        Cuidado con la coincidencia de nombres: en análisis de texto, “LDA” significa más a menudo latent Dirichlet allocation (asignación latente de Dirichlet), un método sin relación que sirve para encontrar temas en documentos.
      </p>

      <h2>De un vistazo</h2>
      <Fig caption="Qué intenta conservar cada método y qué se sabe que distorsiona. Los métodos “lineales” solo pueden girar y aplanar; los no lineales pueden doblar y estirar.">
        <div className={l.scroll}>
          <table className={l.table} style={{ minWidth: 560 }}>
            <thead><tr>{["Método", "Tipo", "Conserva", "No te fíes de", "Velocidad"].map((h) => <th key={h} style={{ textAlign: "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {TABLE.map((r) => (
                <tr key={r[0]}>{r.map((c, i) => <td key={i} style={{ textAlign: "left" }}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </Fig>

      <h2>Cómo leer estas gráficas</h2>
      <ul>
        <li><strong>Fíate más de los vecinos que de las distancias.</strong> Los puntos dibujados uno junto al otro suelen estar cerca en el espacio original. Los que están lejos pueden estarlo o no.</li>
        <li><strong>Ignora el tamaño de los clústeres y los huecos</strong> en t-SNE y UMAP. Una mancha grande no es necesariamente un grupo variado, y un hueco amplio no es necesariamente una gran diferencia.</li>
        <li><strong>Revisa el espacio original.</strong> Antes de creerte un patrón, confírmalo con distancias o similitudes reales en los vectores completos.</li>
        <li><strong>Prueba más de un ajuste y de una semilla.</strong> Un patrón que sobrevive a distintas perplejidades, números de vecinos y semillas aleatorias tiene más probabilidades de ser real.</li>
        <li><strong>Los datos aleatorios pueden parecer estructurados.</strong> Los métodos de vecindarios pueden producir grumos incluso a partir de ruido, así que desconfía de los clústeres que no puedas explicar.</li>
      </ul>
      <Callout title="En una frase">
        Toda imagen en 2D de datos de muchas dimensiones es un compromiso; entiende qué compromiso hizo tu método antes de leerle un significado.
      </Callout>
      <p>
        Para entender por qué existe esa estructura, mira <ArticleLink slug="latent-space">El espacio latente</ArticleLink> y <ArticleLink slug="what-are-embeddings">¿Qué son los embeddings?</ArticleLink>.
        La guía del sitio <ArticleLink slug="pca-vs-umap">PCA vs UMAP</ArticleLink> muestra cómo se usan estos dos métodos en el <Link href="/embedding">explorador de Embeddings</Link>, donde puedes cambiar entre ellos con 10,000 palabras reales.
      </p>
    </>
  );
}

// Rendered by the article page, after the FAQ.
export const reading = [
  { href: "https://distill.pub/2016/misread-tsne/", title: "How to Use t-SNE Effectively", source: "Distill, 2016", note: "ejemplos interactivos de cada trampa de t-SNE (en inglés)" },
  { href: "https://pair-code.github.io/understanding-umap/", title: "Understanding UMAP", source: "Google PAIR", note: "UMAP y t-SNE lado a lado, de forma interactiva (en inglés)" },
  { href: "https://umap-learn.readthedocs.io/en/latest/how_umap_works.html", title: "How UMAP Works", source: "documentación de umap-learn", note: "en inglés" },
  { href: "https://es.wikipedia.org/wiki/An%C3%A1lisis_de_componentes_principales", title: "Análisis de componentes principales", source: "Wikipedia en español" },
  { href: "https://en.wikipedia.org/wiki/Principal_component_analysis", title: "Principal component analysis", source: "Wikipedia", note: "en inglés" },
];

// Shown as the FAQ section and as FAQPage structured data. Plain strings, so they work in both.
export const faq = [
  { q: "¿Cuál es la diferencia entre PCA, t-SNE y UMAP?", a: "PCA es un método lineal que conserva las direcciones con más dispersión, así que mantiene la forma general pero puede mezclar grupos pequeños. t-SNE se concentra en mantener juntos a los vecinos cercanos y es bueno para mostrar clústeres, pero las distancias entre clústeres significan poco. UMAP tiene un objetivo parecido al de t-SNE, corre más rápido y suele conservar un poco más de la estructura global." },
  { q: "¿UMAP es mejor que t-SNE?", a: "Ninguno es mejor en todos los casos. UMAP suele ser más rápido con conjuntos de datos grandes y tiende a conservar más de la disposición a gran escala, mientras que t-SNE a menudo separa los clústeres locales con mucha limpieza. Los dos dependen de ajustes como la perplejidad o el número de vecinos, así que prueba unos cuantos valores antes de sacar conclusiones." },
  { q: "¿Para qué reducir los embeddings a 2D o 3D?", a: "Las personas no podemos ver cientos de dimensiones. Proyectar los embeddings a dos o tres permite graficarlos y detectar clústeres, valores atípicos y estructura. Toda proyección desecha información, así que la imagen es un resumen útil, no un mapa exacto del espacio original." },
  { q: "¿Puedo fiarme de las distancias en una gráfica de t-SNE o UMAP?", a: "Solo a nivel local. Los puntos que quedan juntos probablemente estaban cerca en el espacio original, pero los huecos entre clústeres y el tamaño de cada clúster a menudo están distorsionados. PCA conserva con más fidelidad las distancias grandes, y por eso conviene comparar más de un método." },
];
