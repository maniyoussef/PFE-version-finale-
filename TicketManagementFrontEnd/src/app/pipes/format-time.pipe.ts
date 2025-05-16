import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
  standalone: true
})
export class FormatTimePipe implements PipeTransform {
  transform(seconds: number | undefined): string {
    if (seconds === undefined || seconds === null) {
      return 'Non disponible';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0 && minutes === 0) {
      return '< 1min';
    }
    
    if (hours === 0) {
      return `${minutes}min`;
    }
    
    return `${hours}h ${minutes}min`;
  }
} 