export type PetActionType = 'run' | 'ball' | 'play';

const actionMessages: Record<string, Record<PetActionType, string[]>> = {
  dog: {
    run: [
      "*zooms around* WOO! Look at me go! I'm a fast doggo!",
      "*dashes* I'm so fast! Did you see that?",
      "*barking excitedly* Chase me! I'm a blur!",
    ],
    ball: [
      "*catches ball* GOT IT! I'm the best at fetch!",
      "*wags tail* I love my ball! Can we do it again?",
      "*holding ball* It's my favorite thing in the world!",
    ],
    play: [
      "*paws at air* Play with me! This is so much fun!",
      "*jumps happily* Yay! Play time! I love playing with you!",
      "*play bow* Come on! Let's have some fun!",
    ],
  },
  chicken: {
    run: [
      "*flaps wings* Look at me run! I'm a racing chicken!",
      "*scurries* Zoom zoom! I'm faster than I look!",
      "*clucking* Speed! I am speed!",
    ],
    ball: [
      "*pecks at ball* What is this sphere? I shall peck it!",
      "*rolls ball* It's a giant egg! Just kidding, it's a ball!",
      "*circles ball* I have conquered the round object!",
    ],
    play: [
      "*puffs out feathers* I'm playing! Look at my fancy moves!",
      "*hops around* Peep peep! This is fun!",
      "*scratches ground* I'm looking for treats... but playing is better!",
    ],
  },
  crab: {
    run: [
      "*scuttles sideways* Sideways speed! I'm a blur of shell!",
      "*zips along the beach* You can't catch a crab this fast!",
      "*clicks claws* Speed scuttle engaged!",
    ],
    ball: [
      "*snips at ball* It's mine now! I'm holding it with my claws!",
      "*scuttles with ball* My precious sphere! No one can have it!",
      "*lifts ball* Look at my strength!",
    ],
    play: [
      "*waves claws* Snap snap! I'm playing! Don't get pinched!",
      "*buries ball in sand* Hide and seek! Oh wait, I see it.",
      "*dances* Crab dance! This is my favorite game!",
    ],
  },
  dino: {
    run: [
      "*stomps quickly* RARR! I'm a fast prehistoric beast!",
      "*thumps along* The ground shakes when I run!",
      "*zooms* I'm the fastest dino in the valley!",
    ],
    ball: [
      "*nuzzles ball* Is this a fossil? No, it's a toy!",
      "*roars at ball* Play with me, round thing!",
      "*pushes ball with head* Dino soccer! I'm winning!",
    ],
    play: [
      "*wiggles tail* RAWR means 'I love to play' in dinosaur!",
      "*chomps at the air* Snap! I'm a playful hunter!",
      "*jumps* Prehistoric parkour! This is awesome!",
    ],
  },
  horse: {
    run: [
      "*gallops* Clip-clop-zoom! Look at my majestic speed!",
      "*neighs* I'm a racing stallion! Follow me!",
      "*tosses mane* The wind feels great when I run!",
    ],
    ball: [
      "*nudges ball* This is a funny looking apple!",
      "*kicks ball gently* Boing! I'm playing horse-ball!",
      "*inspects ball* It's round and blue! My favorite!",
    ],
    play: [
      "*rears up playfully* Neigh! I'm so happy today!",
      "*trots in circles* Look at my fancy footwork!",
      "*whinnies* Playtime is the best time!",
    ],
  },
  rat: {
    run: [
      "*scurries* Squeak! I'm a tiny speedster!",
      "*zips under things* You can't catch me, I'm too quick!",
      "*twitches nose* I smell... speed!",
    ],
    ball: [
      "*climbs on ball* I'm king of the hill! Or king of the ball!",
      "*pushes ball with nose* Squeak! It's rolling!",
      "*nibbles gently* Is it cheese? No, but it's fun!",
    ],
    play: [
      "*does a pop-corn jump* Squeak squeak! I'm so excited!",
      "*chases tail* I'm gonna get it! Wait, where did it go?",
      "*wiggles whiskers* You're my favorite giant to play with!",
    ],
  },
  snail: {
    run: [
      "*wiggles eye stalks* Look at me run! I'm moving... moderately fast!",
      "*zooms (relatively)* I'm breaking my own speed records!",
      "*leaves a trail of speed* Follow the slime if you can!",
    ],
    ball: [
      "*slowly climbs ball* I'm a mountain climber! This ball is huge!",
      "*sticks to ball* It's my new shell! Just kidding.",
      "*nudges with antenna* Boop! I moved it a millimeter!",
    ],
    play: [
      "*retreats and pops back out* Peek-a-boo! Did I scare you?",
      "*stretches out* I'm reaching for the fun!",
      "*wiggles* This is the most excitement I've had all week!",
    ],
  },
  snake: {
    run: [
      "*slithers quickly* I'm a fast noodle!",
      "*zips* Speed noodle mode engaged!",
      "*hisses with excitement* Sss-speed! Look at me go!",
    ],
    ball: [
      "*coils around ball* It's my precious orb! I shall protect it!",
      "*nudges with nose* Boop! Slither-ball is my favorite game!",
      "*flicks tongue* It tastes like... fun!",
    ],
    play: [
      "*wiggles into a pretzel* Look at me! I'm a knot!",
      "*stands up tall* Sss-surprise! I'm playing!",
      "*loops around* I'm a tiny rollercoaster!",
    ],
  },
};

const genericMessages: Record<PetActionType, string[]> = {
  run: ["*runs around* This is fun!", "*zooms* I'm so fast!", "*dashes* Catch me if you can!"],
  ball: ["*plays with ball* I love my toy!", "*catches it* Got the ball!", "*rolls it* Look at it go!"],
  play: ["*jumps happily* Play time!", "*wiggles* Having so much fun!", "*paws at air* Yay!"],
};

export function getRandomPetActionMessage(petType: string, action: PetActionType): string {
  const typeMessages = actionMessages[petType] || genericMessages;
  const variations = typeMessages[action] || genericMessages[action];
  return variations[Math.floor(Math.random() * variations.length)];
}
