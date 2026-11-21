/* ---------- Menu content that follows the carousel ---------- */
const EXTRA=[
 {tag:'Chef\u2019s pick',story:'The octopus is slow-cooked until tender, then charred over embers for a smoky edge. It sits on a romesco of roasted red peppers, with potatoes crushed and fried until the skins crackle.',pair:'Albari\u00f1o, crisp and saline',
  items:[['Charred octopus','Romesco, crushed potatoes, sorrel',18,1],['Burrata & fire-roasted tomato','Basil oil, charred sourdough',16],['Wild mushroom arancini','Truffle mayo, pecorino',13],['Beef carpaccio','Capers, rocket, aged parmesan',17]],
  steps:[['Braised','Octopus is simmered slowly until just tender.'],['Charred','Finished over embers for colour and smoke.'],['Plated','On warm romesco with crisp potatoes and sorrel.']]},
 {tag:'From the open fire',story:'A thick-cut chop, marinated overnight with garlic and herbs, grilled over oak and rested before it reaches you. Charred lemon and cherry tomatoes cut through the richness, and rocket adds pepper.',pair:'Nebbiolo, structured and dry',
  items:[['Herb-grilled pork chop','Charred lemon, rocket, cherry tomatoes',28,1],['Rosemary lamb chops','Roasted lemon, smoked garlic jus',34],['Dry-aged ribeye','Bone marrow butter, watercress',46],['Whole sea bream','Salsa verde, charred fennel',32]],
  steps:[['Marinated','Garlic, thyme and olive oil, overnight.'],['Grilled','Seared hard over oak, then moved to the cooler side.'],['Rested','Ten minutes off the heat so the juices stay in.']]},
 {tag:'Guest favourite',story:'Prawns are seared hot and fast, then tossed in a sweet-heat chilli and garlic glaze. Crushed peanuts and spring onion add crunch, and lime and crisp greens keep it fresh.',pair:'Riesling, off-dry and bright',
  items:[['Garlic prawns','Peanut crunch, lime, crisp greens',26,1],['Seared scallops','Cauliflower purée, brown butter',24],['Mussels in white wine','Garlic, parsley, grilled bread',21],['Fish & fennel stew','Saffron broth, rouille',29]],
  steps:[['Sourced','Prawns arrive twice a week, shell-on.'],['Seared','Very hot pan, ninety seconds a side.'],['Glazed','Chilli-garlic glaze goes on at the last moment.']]},
 {tag:'Sunday-style supper',story:'Free-range chicken, brined, then roasted until the skin crackles and the meat stays juicy. It comes with honey-roasted carrots, golden potatoes, charred broccoli and sweet peas.',pair:'Chardonnay, lightly oaked',
  items:[['Thyme-roasted chicken','Honey carrots, potatoes, broccoli, peas',25,1],['Smoked chicken thigh','Harissa yoghurt, flatbread',24],['Slow-roast lamb shoulder','White beans, salsa verde',32],['Mushroom & thyme pie','Buttered greens',22]],
  steps:[['Brined','Overnight in salt, thyme and lemon.'],['Roasted','High heat to crisp the skin, then lower to finish.'],['Rested','Carved at the table so nothing is lost.']]}
];
DISHES.forEach((d,i)=>Object.assign(d,EXTRA[i]));
