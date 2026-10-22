import { Link } from "@/i18n/navigation";
import { Chips, Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";

export default function WhatIsAToken() {
  return (
    <>
      <p>
        Cuando escribes una frase en un chatbot, el modelo nunca ve tus letras, y tampoco ve tus palabras. Ve una lista de números enteros.
        El paso que convierte el texto en esos números se llama <strong>tokenización</strong>, y cada pedazo de texto que recibe su propio número es un <strong>token</strong>.
      </p>
      <p>
        Aquí tienes una frase corta dividida por el tokenizador <code>o200k_base</code>, el que usa GPT-4o y el que viene por defecto en el Tokenizador de este sitio.
        Cada ficha es un token, y el número debajo es el <strong>ID</strong> de ese token: su posición en la lista de pedazos que conoce el tokenizador.
      </p>
      <Fig caption="“The cat sat on the mat.” (“El gato se sentó en la alfombra.”) en o200k_base: 7 tokens. Los puntos marcan los espacios, que pertenecen al inicio del token siguiente.">
        <Chips items={[["The", 976], ["·cat", 9059], ["·sat", 10139], ["·on", 402], ["·the", 290], ["·mat", 2450], [".", 13]]} />
      </Fig>
      <p>
        Hasta aquí parece “una palabra, un token”. Pero ya hay dos detalles que rompen esa idea. El punto final es un token aparte.
        Y el espacio delante de cada palabra va pegado a la palabra: el vocabulario del modelo tiene una entrada distinta para <code>·cat</code> (con espacio) y para <code>cat</code> (sin él).
      </p>

      <h2>El vocabulario es una lista fija</h2>
      <p>
        Un tokenizador viene con un vocabulario: una lista de pedazos de texto, cada uno emparejado con un ID. El nombre <code>o200k_base</code> da una pista de su tamaño, unas 200,000 entradas.
        El más antiguo <code>cl100k_base</code> (GPT-4 y GPT-3.5) tiene unas 100,000, y el de GPT-2 tiene unas 50,000.
      </p>
      <p>
        Como la lista es fija, el tokenizador tiene que expresar <em>cualquier</em> entrada con los pedazos que ya tiene. Las mayúsculas, los espacios y la ortografía importan.
        En <code>o200k_base</code>, <code>cat</code> es el ID 8837, <code>·cat</code> es el 9059 y <code>Cat</code> es el 23546. Para el modelo son tres números sin relación.
        Solo aprende que significan casi lo mismo al verlos usados de forma parecida durante el entrenamiento.
      </p>

      <h2>¿Por qué no usar simplemente palabras?</h2>
      <p>
        Un vocabulario por palabras suena más simple, pero se mete en problemas enseguida. Las palabras no se acaban nunca: nombres, errores de dedo, jerga, nombres de productos, identificadores de código, palabras de otros idiomas.
        Cualquier palabra que faltara en la lista tendría que reemplazarse por una marca genérica de “desconocido”, y su significado se perdería.
      </p>
      <p>
        El extremo opuesto, un token por carácter, nunca se topa con una palabra desconocida, pero hace que cada texto sea muy largo.
        Los modelos trabajan más cuanto más larga es la entrada, y una sola letra casi no lleva significado por sí misma.
      </p>
      <p>
        Los tokenizadores modernos quedan en medio. Usan pedazos de <strong>subpalabra</strong> (más pequeños que una palabra y casi siempre más grandes que una letra): las palabras comunes reciben un solo token, y las más raras se arman con unas pocas partes más pequeñas y reutilizables.
        El equilibrio completo se explica en <ArticleLink slug="why-tokens">Por qué los modelos leen tokens y no letras ni palabras</ArticleLink>.
      </p>
      <Fig caption="La misma palabra (“unbelievable”, “increíble”), dividida de forma distinta por tres tokenizadores cuando abre el texto. Con un espacio delante, “ unbelievable” es un solo token en los tres.">
        <Chips label="o200k_base · 3 tokens" items={[["un"], ["bel"], ["ievable"]]} />
        <Chips label="cl100k_base · 3 tokens" items={[["un"], ["belie"], ["vable"]]} />
        <Chips label="gpt2 · 4 tokens" items={[["un"], ["bel"], ["iev"], ["able"]]} />
        <Chips label="o200k_base, con un espacio delante · 1 token" items={[["·unbelievable", 83614]]} />
      </Fig>
      <p>
        Vale la pena mirar de nuevo esa última fila. En medio de una frase, donde la palabra va después de un espacio, es lo bastante común para ganarse su propio token.
        Al principio de un texto, sin espacio delante, la misma palabra es rara, así que se arma con partes.
      </p>

      <h2>Cómo se eligen los pedazos</h2>
      <p>
        Los tokenizadores de GPT usan un método llamado <strong>byte pair encoding</strong> (BPE). El entrenamiento parte de los pedazos más pequeños posibles, los bytes individuales del texto.
        Luego recorre una gran cantidad de texto, encuentra el par de pedazos vecinos que aparece más seguido y lo fusiona en una nueva entrada del vocabulario.
        Repite esto hasta que el vocabulario llega a su tamaño objetivo.
      </p>
      <p>
        Las primeras fusiones capturan pares de letras muy comunes como <code>in</code> o <code>he</code>. Las posteriores arman palabras frecuentes completas y terminaciones como <code>ization</code>.
        Por eso <code>tokenization</code> sale como <code>token</code> + <code>ization</code> en los tres tokenizadores de GPT.
        Los pedazos son estadísticos, no gramaticales: siguen lo que era frecuente en el texto de entrenamiento, no dónde cortaría una palabra un diccionario.
        Para un ejemplo resuelto, fusión por fusión, mira <ArticleLink slug="tokenization-algorithms">Cómo se construyen los tokenizadores</ArticleLink>.
      </p>
      <p>
        Las opciones de LLaMA en el Tokenizador usan otra herramienta, SentencePiece. Ahí vas a notar dos diferencias.
        Su vocabulario escribe los espacios como <code>▁</code> (haz clic en un token para verlo como su “pieza del vocabulario”), y todo texto empieza con un token especial <code>&lt;s&gt;</code> que marca el inicio de una secuencia.
      </p>

      <h2>Efectos secundarios que puedes ver</h2>
      <p>Una vez que sabes que el modelo lee tokens, algunas rarezas conocidas tienen más sentido.</p>
      <ul>
        <li>
          <strong>Las preguntas de ortografía se complican.</strong> En <code>o200k_base</code>, <code>strawberry</code> (“fresa”) son tres tokens: <code>st</code>, <code>raw</code>, <code>berry</code>.
          El modelo nunca ve directamente diez letras separadas, y esa es una de las razones por las que las preguntas de contar letras confunden a los modelos.
        </li>
        <li>
          <strong>Los números se cortan en trozos.</strong> Los tokenizadores de GPT dividen <code>1234567</code> en <code>123</code>, <code>456</code>, <code>7</code>.
          El tokenizador de LLaMA lo divide en un token por dígito. Hacer aritmética con trozos así es más difícil de lo que parece.
        </li>
        <li>
          <strong>Los límites de longitud se cuentan en tokens.</strong> La ventana de contexto de un modelo (la mayor cantidad de texto que puede leer a la vez) y muchos precios de las API se miden en tokens, no en palabras ni en caracteres.
        </li>
      </ul>

      <h2>Qué pasa después</h2>
      <p>
        Un ID de token por sí solo es apenas una posición en una lista. El ID 9059 no es “más” que el ID 402 en ningún sentido útil.
        El siguiente paso dentro de un modelo es cambiar cada ID por una lista larga de números, llamada embedding, que sí lleva significado.
        Ese es el tema de <Link href="/learn/how-a-word-becomes-300-numbers">Cómo una palabra se convierte en 300 números</Link>.
      </p>
    </>
  );
}

export const faq = [
  { q: "¿Qué es un token en ChatGPT?", a: "Un token es la unidad de texto que ChatGPT lee y escribe. Las palabras comunes suelen ser un solo token, a menudo con el espacio que va delante, mientras que las palabras raras se dividen en pedazos. Cada token tiene un ID, y los límites de uso y los precios de la API se cuentan en tokens, no en palabras." },
  { q: "¿Cómo cuento los tokens de mi texto?", a: "Pega el texto en una herramienta de tokenización, como el Tokenizador de WordCanvas3D, que muestra cada token y su ID para varios tokenizadores reales. En código, la biblioteca tiktoken de OpenAI cuenta los tokens para los modelos GPT. Los conteos cambian entre modelos porque cada uno tiene su propio vocabulario." },
  { q: "¿El espacio forma parte del token?", a: "Por lo general, sí. Los tokenizadores al estilo GPT pegan el espacio al inicio de la palabra siguiente, así que “ cat” con espacio y “cat” sin él son tokens distintos con ID distintos. Las mayúsculas también cambian el token: “Cat” es otra entrada aparte." },
  { q: "¿Por qué la misma palabra se divide de formas distintas?", a: "La división depende del vocabulario del tokenizador y del contexto, como un espacio delante o una mayúscula. “unbelievable” justo al principio de un texto son tres pedazos en o200k_base, mientras que “ unbelievable” después de un espacio es un solo token. Además, cada modelo tiene su propio vocabulario." },
];
