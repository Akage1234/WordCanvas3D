import { Link } from "@/i18n/navigation";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import { Chips, Fig } from "@/components/learn/guides";
import { ArticleLink } from "@/components/learn/kit";
import s from "@/components/learn/learn.module.css";

const [RED, TEAL, , YELLOW] = CLUSTER_COLORS;

const GREETINGS = [
  ["Inglés", "Hello, world.", 4, 4, 4],
  ["Árabe", "مرحباً بالعالم.", 15, 13, 6],
  ["Hindi", "नमस्ते दुनिया।", 25, 15, 6],
  ["Japonés", "こんにちは世界。", 11, 5, 3],
];
const ENCODERS = [["gpt2", RED], ["cl100k_base", YELLOW], ["o200k_base", TEAL]];

export default function EmojiAndLanguages() {
  return (
    <>
      <p>
        Escribe “Hello, world.” (“Hola, mundo.”) en el Tokenizador y obtienes 4 tokens. Escribe el mismo saludo en hindi y, según el tokenizador, puedes obtener desde 6 hasta 25.
        Los emoji se comportan parecido: un solo 🎉 puede ocupar dos, tres o más tokens. Nada de esto es al azar. Viene de cómo se guarda el texto como bytes y de lo que el tokenizador vio durante el entrenamiento.
      </p>

      <h2>Todo empieza como bytes</h2>
      <p>
        Las computadoras guardan el texto usando una codificación, una regla fija para convertir cada carácter en <strong>bytes</strong> (un byte es un número pequeño del 0 al 255, la unidad básica de la memoria de una computadora).
        Hoy casi todo usa <strong>UTF-8</strong>, que le da a cada carácter entre uno y cuatro bytes:
      </p>
      <ul>
        <li>Letras latinas básicas, dígitos y signos de puntuación: 1 byte cada uno.</li>
        <li>Letras árabes, hebreas, griegas y cirílicas: 2 bytes cada una.</li>
        <li>Caracteres devanagari (los del hindi), chinos y japoneses: 3 bytes cada uno.</li>
        <li>La mayoría de los emoji: 4 bytes cada uno.</li>
      </ul>
      <p>
        Lo puedes ver en el Tokenizador: debajo de la entrada muestra el número de <strong>puntos de código</strong> (los caracteres numerados del estándar Unicode; más o menos, caracteres) y de <strong>bytes UTF-8</strong>.
        “Hello, world.” son 13 caracteres y 13 bytes. El “नमस्ते दुनिया।” en hindi son 14 puntos de código pero 40 bytes.
      </p>

      <h2>Las fusiones siguen a los datos de entrenamiento</h2>
      <p>
        Los tokenizadores de GPT son tokenizadores BPE <em>a nivel de bytes</em>. Parten de bytes sueltos y aprenden fusiones de un gran montón de texto de entrenamiento, quedándose con los pares que aparecen más seguido.
        (La primera guía, <Link href="/learn/what-is-a-token">Qué es un token</Link>, da la versión corta;
        <ArticleLink slug="tokenization-algorithms"> Cómo se construyen los tokenizadores</ArticleLink> recorre las fusiones paso a paso).
      </p>
      <p>
        Si el texto de entrenamiento está casi todo en inglés, la mayoría de las fusiones terminan siendo palabras y partes de palabras del inglés. Otras escrituras reciben menos fusiones, así que su texto se queda dividido en pedazos más pequeños.
        En el peor de los casos, un solo carácter queda repartido entre varios tokens, porque sus bytes nunca se fusionaron.
      </p>
      <Fig caption="Número de tokens del mismo saludo (“Hola, mundo.”), tal como lo muestra el Tokenizador de este sitio. Cada frase incluye su signo de puntuación final.">
        <div className={s.legend}>
          {ENCODERS.map(([name, color]) => <span key={name} style={{ "--tc": color }}>{name}</span>)}
        </div>
        <dl className={s.bars}>
          {GREETINGS.map(([lang, text, ...counts]) => (
            <div key={lang} style={{ display: "contents" }}>
              <dt title={text}>{lang}</dt>
              <dd>
                {counts.map((n, i) => (
                  <span key={i} className={s.bar} style={{ "--tc": ENCODERS[i][1], "--n": n }}>
                    <i />{n}
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Fig>
      <p>
        Hay dos cosas que llaman la atención. Primero, el inglés cuesta los mismos 4 tokens en todos, porque cada uno de estos vocabularios aprendió <code>Hello</code>, <code>,</code> y <code>·world</code> hace mucho.
        Segundo, el más nuevo, <code>o200k_base</code>, es mucho mejor con las demás escrituras. Su vocabulario es más o menos el doble de grande que el de <code>cl100k_base</code>,
        y sus entradas extra incluyen muchos más pedazos de texto que no está en inglés. <code>世界</code> (“mundo” en japonés) es un token en <code>o200k_base</code>, mientras que <code>cl100k_base</code> necesita tres y parte <code>世</code> en bytes en bruto.
      </p>

      <h2>Emoji: varios bytes, a veces varios caracteres</h2>
      <p>
        El emoji 🎉 es un carácter guardado como cuatro bytes: <code>F0 9F 8E 89</code>. Un tokenizador que no haya fusionado esos bytes en un solo pedazo tiene que gastar varios tokens en él.
        El Tokenizador muestra en bytes hexadecimales los pedazos que son solo parte de un carácter, así que puedes ver exactamente dónde se hace el corte.
      </p>
      <Fig caption="Los cuatro bytes de 🎉 y cómo los agrupan dos tokenizadores. Los números debajo de cada ficha son ID de token.">
        <Chips label="cl100k_base · 3 tokens" items={[["F0 9F", 9468], ["8E", 236], ["89", 231]]} />
        <Chips label="o200k_base · 2 tokens" items={[["F0 9F 8E", 71344], ["89", 231]]} />
        <Chips label="👍 en o200k_base · 1 token" items={[["👍", 82514]]} />
      </Fig>
      <p>
        Los emoji populares como 👍 y ✅ son un solo token en <code>o200k_base</code>, mientras que en <code>cl100k_base</code> todavía ocupan dos o tres.
      </p>
      <p>
        Algunos emoji ni siquiera son un solo carácter. 🛠️ es el símbolo del martillo y la llave más un <strong>selector de variación</strong> invisible que pide el estilo de emoji a color.
        Eso da 4 tokens en los dos tokenizadores de la época de GPT-4. Los emoji de familia como 👨‍👩‍👧 son varias personas pegadas con caracteres invisibles de “unión de ancho cero” (zero width joiner):
        5 puntos de código, 18 bytes y 8 tokens en <code>o200k_base</code>, para lo que parece un solo símbolo.
      </p>

      <h2>Por qué importa el conteo</h2>
      <ul>
        <li><strong>Costo.</strong> Muchas API de IA cobran por token, así que el mismo mensaje puede costar más en un idioma que en otro.</li>
        <li><strong>Contexto.</strong> La ventana de contexto de un modelo es un presupuesto de tokens. El texto que necesita más tokens la llena antes.</li>
        <li><strong>Velocidad.</strong> Los modelos generan un token a la vez, así que una respuesta que necesita más tokens tarda más en escribirse.</li>
      </ul>
      <p>
        Por eso también importan los cambios de tokenizador. Pasar de <code>cl100k_base</code> a <code>o200k_base</code> redujo el saludo en hindi de arriba de 15 tokens a 6, sin cambiar nada del texto.
      </p>

      <h2>Lo que conviene recordar</h2>
      <ul>
        <li><strong>Cuenta con el tokenizador correcto.</strong> El mismo texto da conteos distintos en vocabularios distintos, así que el conteo de un modelo no sirve para otro.</li>
        <li><strong>La decoración no es gratis.</strong> Los emoji, los caracteres de dibujo de recuadros y los símbolos llamativos en un prompt pueden costar varios tokens cada uno sin agregar mucho significado.</li>
        <li><strong>Nada es nunca “desconocido”.</strong> Como los tokenizadores a nivel de bytes siempre pueden recurrir a bytes sueltos, se puede codificar cualquier texto. El texto raro no se rechaza, solo sale caro.</li>
      </ul>

      <h2>Pruébalo</h2>
      <p>
        El Tokenizador tiene dos ejemplos hechos para este artículo: <strong>Escrituras del mundo</strong> y <strong>Emoji</strong>.
        Carga uno, luego cambia de tokenizador y mira cómo cambia el número de tokens. Activa también el tokenizador de LLaMA: usa más o menos un token por carácter para estas escrituras,
        y bytes en bruto para la mayoría de los emoji.
      </p>
    </>
  );
}

export const faq = [
  { q: "¿Por qué los emoji usan tantos tokens?", a: "La mayoría de los emoji ocupan cuatro bytes en UTF-8, y algunos son varios emoji unidos, como los tonos de piel o los emoji de familia. Los emoji raros no tienen un token propio, así que un tokenizador a nivel de bytes los escribe en pedazos de bytes. Un solo emoji puede costar desde un token hasta más de diez." },
  { q: "¿Por qué otros idiomas distintos del inglés cuestan más tokens?", a: "Los tokenizadores aprenden sus pedazos de texto de entrenamiento que suele estar casi todo en inglés, así que las palabras en inglés reciben tokens largos y eficientes. Las escrituras que aparecen menos, o que necesitan más bytes por carácter en UTF-8, se dividen en pedazos más pequeños. La misma frase puede ocupar varias veces más tokens en hindi, tailandés o birmano que en inglés." },
  { q: "¿Los tokenizadores más nuevos cierran la brecha entre idiomas?", a: "En parte. Los vocabularios más grandes entrenados con más texto multilingüe, como o200k_base, el que usa GPT-4o, reducen el número de tokens de muchos idiomas comparados con tokenizadores más antiguos como cl100k_base. La brecha se achica pero no desaparece, porque los datos de entrenamiento siguen siendo desiguales entre idiomas." },
  { q: "¿Usar más tokens cuesta más dinero?", a: "Sí, en la mayoría de las API de IA. Los precios se cobran por token de entrada y de salida, y las ventanas de contexto se miden en tokens, así que el texto que se divide en más pedazos cuesta más y llena antes la ventana de contexto." },
];
