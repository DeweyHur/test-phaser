import CharacterSprite from './characterSprite';

class Character {
  constructor(game, sprite, { x, y, state }) {
    this.game = game;
    this.sprite = new CharacterSprite(game, sprite);
    this.sprite.anims.play(state);
  }
};

export default Character;