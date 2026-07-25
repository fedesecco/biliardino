import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({ name: 'playerInitials' })
export class PlayerInitialsPipe implements PipeTransform {
  transform(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === '') {
      return '';
    }

    const firstInitial = parts[0].charAt(0);
    const lastInitial =
      parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return `${firstInitial}${lastInitial}`.toLocaleUpperCase('it-IT');
  }
}
