import { Character } from './character';

export class Squad {
    name: string;
    characters: Character[];
    cursor?: number;

    constructor(name: string) {
        this.name = name;
        this.characters = [];
    }

    add(...characters: Character[]) {
        this.characters = [...this.characters, ...characters];
        if (this.characters.length > 0) {
            this.cursor = this.cursor || 0;
        }
    }

    shift() {
        if( this.cursor !== undefined ) {
            this.cursor = (this.cursor + 1) % this.characters.length;
        }
    }

    unshift() {
        if( this.cursor !== undefined ) {
            this.cursor = (this.cursor + this.characters.length - 1) % this.characters.length;
        }
    }

    avatar(): Character|null {
        return this.cursor !== undefined? this.characters[this.cursor] : null;
    }

}