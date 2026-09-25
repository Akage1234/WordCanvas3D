"use client";

import { useState } from "react";
import { CLUSTER_COLORS } from "@/components/embedding/embeddingPalette.mjs";
import s from "./what-are-embeddings.module.css";

const GROUPS = ["animals", "food", "places", "colours", "numbers", "people", "tech"];

// Real data from the site's GloVe file (10,000 words x 300 numbers), computed offline:
// [word, group, x, y, six nearest words in the full 10,000-word vocabulary with cosine similarity].
// x, y: a 2D layout (metric MDS on cosine distances between these 42 words only), scaled to -1..1.
const POINTS = [["cat",0,0.02,0.793,[["dog",0.722],["cats",0.699],["pet",0.618],["dogs",0.575],["animal",0.544],["horse",0.541]]],["dog",0,0.001,0.635,[["dogs",0.804],["cat",0.722],["pet",0.665],["animal",0.607],["horse",0.603],["cats",0.561]]],["horse",0,-0.2,0.726,[["horses",0.836],["riding",0.627],["dog",0.603],["derby",0.571],["ride",0.565],["rode",0.556]]],["cow",0,0.512,0.699,[["mad",0.665],["cattle",0.661],["sheep",0.658],["beef",0.629],["pig",0.599],["animal",0.577]]],["lion",0,-0.326,0.849,[["elephant",0.61],["dragon",0.556],["bear",0.55],["lions",0.549],["golden",0.543],["wolf",0.536]]],["bird",0,0.231,0.674,[["birds",0.756],["flu",0.697],["virus",0.593],["influenza",0.582],["poultry",0.563],["animal",0.562]]],["mouse",0,0.335,0.897,[["cat",0.534],["cartoon",0.459],["animated",0.455],["mickey",0.454],["computer",0.451],["pig",0.446]]],["fish",0,0.716,0.276,[["salmon",0.681],["meat",0.649],["birds",0.608],["fishing",0.597],["animals",0.585],["species",0.578]]],["apple",1,0.45,-0.62,[["microsoft",0.635],["google",0.609],["intel",0.563],["software",0.56],["ibm",0.558],["computer",0.528]]],["fruit",1,0.761,-0.093,[["fruits",0.834],["vegetables",0.659],["vegetable",0.612],["juice",0.605],["flowers",0.566],["flavor",0.566]]],["bread",1,0.901,-0.257,[["flour",0.677],["butter",0.66],["cheese",0.642],["cake",0.621],["meal",0.603],["cooked",0.597]]],["rice",1,0.625,-0.34,[["condoleezza",0.633],["wheat",0.62],["corn",0.584],["vegetables",0.572],["beans",0.564],["grain",0.556]]],["cheese",1,1.0,0.057,[["butter",0.719],["cream",0.68],["bread",0.642],["milk",0.629],["chocolate",0.628],["sauce",0.599]]],["coffee",1,0.687,-0.479,[["tea",0.719],["drinks",0.602],["drink",0.594],["beans",0.571],["sugar",0.561],["fruit",0.56]]],["milk",1,0.883,0.004,[["dairy",0.71],["butter",0.641],["cheese",0.629],["cream",0.627],["meat",0.617],["sugar",0.607]]],["france",2,-0.644,-0.379,[["french",0.789],["paris",0.721],["belgium",0.661],["spain",0.653],["britain",0.641],["germany",0.636]]],["germany",2,-0.789,-0.304,[["german",0.782],["berlin",0.691],["austria",0.686],["europe",0.663],["munich",0.638],["france",0.636]]],["japan",2,-0.43,-0.661,[["japanese",0.807],["tokyo",0.745],["korea",0.692],["china",0.621],["thailand",0.576],["osaka",0.565]]],["paris",2,-0.781,-0.419,[["france",0.721],["french",0.689],["brussels",0.655],["london",0.641],["rome",0.582],["madrid",0.565]]],["london",2,-0.754,-0.057,[["britain",0.659],["british",0.659],["paris",0.641],["england",0.599],["york",0.599],["sydney",0.596]]],["tokyo",2,-0.593,-0.72,[["japan",0.745],["japanese",0.69],["seoul",0.688],["osaka",0.672],["bangkok",0.543],["taipei",0.54]]],["berlin",2,-0.951,-0.198,[["munich",0.703],["germany",0.691],["vienna",0.674],["frankfurt",0.672],["hamburg",0.641],["german",0.636]]],["red",3,0.247,0.168,[["yellow",0.76],["blue",0.753],["green",0.7],["white",0.673],["black",0.661],["pink",0.638]]],["blue",3,0.239,0.261,[["red",0.753],["pink",0.676],["purple",0.675],["green",0.673],["yellow",0.672],["bright",0.666]]],["green",3,0.342,0.018,[["red",0.7],["blue",0.673],["yellow",0.651],["brown",0.645],["bright",0.612],["black",0.611]]],["yellow",3,0.433,0.332,[["red",0.76],["pink",0.691],["purple",0.683],["orange",0.677],["blue",0.672],["bright",0.659]]],["purple",3,0.63,0.528,[["pink",0.719],["yellow",0.683],["blue",0.675],["red",0.636],["bright",0.622],["green",0.61]]],["two",4,-0.161,-0.177,[["three",0.965],["four",0.942],["five",0.907],["six",0.903],["eight",0.868],["seven",0.864]]],["five",4,-0.139,-0.209,[["six",0.975],["four",0.971],["three",0.967],["seven",0.964],["eight",0.963],["nine",0.945]]],["ten",4,-0.23,-0.275,[["twenty",0.884],["fifteen",0.861],["eleven",0.859],["twelve",0.854],["eight",0.844],["five",0.844]]],["king",5,-0.646,0.406,[["queen",0.696],["prince",0.673],["kingdom",0.651],["monarch",0.639],["throne",0.634],["ii",0.624]]],["queen",5,-0.658,0.55,[["elizabeth",0.697],["king",0.696],["princess",0.676],["monarch",0.638],["royal",0.629],["victoria",0.624]]],["prince",5,-0.841,0.397,[["king",0.673],["princess",0.671],["crown",0.587],["nephew",0.583],["duke",0.578],["throne",0.568]]],["man",5,-0.259,0.127,[["woman",0.742],["person",0.718],["one",0.707],["boy",0.705],["he",0.704],["another",0.694]]],["woman",5,-0.357,0.191,[["girl",0.776],["she",0.748],["man",0.742],["mother",0.739],["her",0.727],["female",0.708]]],["boy",5,-0.244,0.356,[["girl",0.842],["boys",0.728],["man",0.705],["kid",0.701],["child",0.68],["father",0.665]]],["girl",5,-0.319,0.344,[["boy",0.842],["woman",0.776],["girls",0.759],["mother",0.707],["child",0.704],["teenager",0.703]]],["computer",6,0.138,-0.754,[["computers",0.84],["software",0.77],["technology",0.682],["internet",0.656],["pc",0.653],["systems",0.649]]],["software",6,0.24,-0.91,[["computer",0.77],["microsoft",0.742],["hardware",0.702],["computers",0.672],["internet",0.651],["technology",0.648]]],["internet",6,-0.044,-0.822,[["web",0.812],["online",0.806],["users",0.743],["networking",0.683],["computer",0.656],["phone",0.651]]],["phone",6,-0.064,-0.679,[["telephone",0.877],["phones",0.788],["mobile",0.71],["calls",0.697],["cellular",0.672],["wireless",0.659]]],["digital",6,0.043,-0.938,[["video",0.695],["audio",0.668],["technology",0.637],["electronic",0.624],["computer",0.616],["dvd",0.602]]]];

// Hand-placed label offsets where labels would collide (positions themselves are untouched).
const LABEL = { two: [-8, -4, "end"], five: [8, 8], ten: [-8, 10, "end"], blue: [8, -6], red: [8, 8], boy: [8, 8], girl: [-8, -4, "end"], woman: [-8, 10, "end"], man: [8, 4], dog: [8, 10], cat: [8, -2], king: [0, 20, "middle"], software: [8, -6], prince: [-8, 4, "end"], france: [8, 2], paris: [-8, 8, "end"] };

const W = 520, H = 380;
const px = (x) => W / 2 - 14 + x * (W / 2 - 64);
const py = (y) => H / 2 - y * (H / 2 - 26);
const byWord = Object.fromEntries(POINTS.map((p) => [p[0], p]));

export function WordMap() {
  const [sel, setSel] = useState("apple");
  const cur = byWord[sel];
  const onMap = new Set(cur[4].map(([w]) => w).filter((w) => byWord[w]));

  return (
    <div className={s.map}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map of 42 words from GloVe, coloured by topic. Selected: ${sel}; lines join it to its nearest neighbours that are also on the map.`}>
        {[...onMap].map((w) => (
          <line key={w} x1={px(cur[2])} y1={py(cur[3])} x2={px(byWord[w][2])} y2={py(byWord[w][3])} className={s.link} />
        ))}
        {POINTS.map(([w, g, x, y]) => {
          const [dx, dy, anchor] = LABEL[w] || [8, 4];
          const state = w === sel ? "sel" : onMap.has(w) ? "near" : "rest";
          return (
            <g key={w} className={s.pt} data-state={state} onClick={() => setSel(w)} style={{ "--tc": CLUSTER_COLORS[g] }}>
              <circle cx={px(x)} cy={py(y)} r={w === sel ? 7 : 5} />
              <text x={px(x) + dx} y={py(y) + dy} textAnchor={anchor || "start"}>{w}</text>
            </g>
          );
        })}
      </svg>

      <div className={s.side}>
        <p className={s.sideHead}>
          Nearest to <b style={{ "--tc": CLUSTER_COLORS[cur[1]] }}>{sel}</b> among all 10,000 words
        </p>
        <ol className={s.nn}>
          {cur[4].map(([w, c]) => (
            <li key={w} data-on={byWord[w] ? "" : undefined}>
              <span>{w}</span>
              <i style={{ "--w": c }} />
              <small>{c.toFixed(2)}</small>
            </li>
          ))}
        </ol>
        <p className={s.hint}>Bold words are also on the map.</p>
      </div>

      <div className={s.picker} role="group" aria-label="Pick a word">
        {GROUPS.map((name, g) => (
          <div key={name} className={s.pickRow} style={{ "--tc": CLUSTER_COLORS[g] }}>
            <span>{name}</span>
            {POINTS.filter((p) => p[1] === g).map(([w]) => (
              <button key={w} type="button" aria-pressed={w === sel} onClick={() => setSel(w)}>{w}</button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
