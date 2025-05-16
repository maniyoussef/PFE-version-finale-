// src/app/pages/home/home.component.ts
import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChildren,
  QueryList,
  AfterViewInit,
  ViewChild,
  Renderer2
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import {
  animate,
  query,
  stagger,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatRippleModule,
    RouterModule,
  ],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate(
          '0.8s cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('staggerList', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [
              animate(
                '0.6s cubic-bezier(0.35, 0, 0.25, 1)',
                style({ opacity: 1, transform: 'translateY(0)' })
              ),
            ]),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('rotate', [
      state('default', style({ transform: 'rotate(0)' })),
      state('rotated', style({ transform: 'rotate(180deg)' })),
      transition('default <=> rotated', animate('300ms ease-in-out')),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0px', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class HomeComponent implements OnInit, AfterViewInit {
  @ViewChildren('productCard', { read: ElementRef })
  productCards!: QueryList<ElementRef>;

  @ViewChildren('.counter')
  counters!: QueryList<ElementRef>;

  mouseX = 0;
  mouseY = 0;
  rotationState = 'default';
  expandedProductIndex: number | null = null;
  isHeroVisible = true;
  scrollProgress = 0;
  currentYear = new Date().getFullYear();
  isAboutSectionVisible = false;
  hasAnimatedCounters = false;

  products = [
    {
      name: 'Divalto',
      description:
        'ERP dédié aux PME et ETI intégrant les nouvelles technologies',
      longDescription:
        "Solution complète de gestion d'entreprise avec modules financiers, CRM, achats, ventes, stocks et production. Adaptable à vos besoins spécifiques.",
      icon: 'business',
      color: '#FF6B6B',
      stats: { users: '1000+', satisfaction: '96%', features: '50+' },
    },
    {
      name: 'First Parc',
      description: 'GMAO pour la gestion précise de parc automobile',
      longDescription:
        'Système intelligent de gestion de flotte avec suivi en temps réel, maintenance prédictive et optimisation des coûts.',
      icon: 'directions_car',
      color: '#4ECDC4',
      stats: { vehicles: '5000+', efficiency: '35%', savings: '25%' },
    },
    {
      name: 'WaveSoft',
      description: "Solution complète d'intégration d'entreprise moderne",
      longDescription:
        "Plateforme unifiée avec base de données unique intégrant toutes les fonctionnalités d'une entreprise moderne. Gestion unifiée des processus métiers.",
      icon: 'integration_instructions',
      color: '#6C5CE7',
      stats: { modules: '30+', intégrations: '50+', clients: '2000+' },
    },
    {
      name: 'FirstMag',
      description: "Solution d'encaissement et de facturation complète",
      longDescription:
        'Logiciel de gestion commerciale avec caisse enregistreuse intelligente, gestion de stocks intégrée et reporting analytique en temps réel.',
      icon: 'point_of_sale',
      color: '#00B894',
      stats: {
        transactions: '1M+',
        utilisateurs: '5000+',
        succursales: '200+',
      },
    },
    {
      name: 'Quorion',
      description: 'Partenaire exclusif des caisses enregistreuses',
      longDescription:
        "Solutions de caisse enregistreuses haute performance pour la Tunisie et l'Afrique de l'Ouest. Matériel certifié et support technique premium.",
      icon: 'receipt',
      color: '#FDCB6E',
      stats: { pays: '12+', partenaires: '150+', installations: '5000+' },
    },
    {
      name: 'Sophos',
      description: 'Pare-feu nouvelle génération pour réseau sécurisé',
      longDescription:
        'Sophos XG Firewall révolutionne la gestion des pare-feux avec protection proactive contre les menaces et contrôle réseau intelligent.',
      icon: 'security',
      color: '#0984E3',
      stats: { menaces: '1M+/jour', réseaux: '10K+', uptime: '99.99%' },
    },
  ];

  constructor(private router: Router, public auth: AuthService, private renderer: Renderer2) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    this.scrollProgress = (scrollTop / height) * 100;
    this.isHeroVisible = scrollTop < 300;
    
    // Check if about section is in view for counter animation
    const aboutSection = document.querySelector('.about-section');
    if (aboutSection) {
      const rect = aboutSection.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
      
      if (isVisible && !this.hasAnimatedCounters) {
        this.animateCounters();
        this.hasAnimatedCounters = true;
      }
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  toggleProductExpansion(index: number) {
    // Close the currently expanded card if clicking on a different one
    if (this.expandedProductIndex === index) {
      this.expandedProductIndex = null;
    } else {
      this.expandedProductIndex = index;
    }
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {}
  
  ngAfterViewInit(): void {
    // Initialize counter animation when in view
    this.checkAboutSectionVisibility();
  }
  
  checkAboutSectionVisibility(): void {
    const aboutSection = document.querySelector('.about-section');
    if (aboutSection) {
      const rect = aboutSection.getBoundingClientRect();
      this.isAboutSectionVisible = rect.top < window.innerHeight && rect.bottom >= 0;
      
      if (this.isAboutSectionVisible && !this.hasAnimatedCounters) {
        setTimeout(() => {
          this.animateCounters();
        }, 500);
        this.hasAnimatedCounters = true;
      }
    }
  }
  
  animateCounters(): void {
    const counters = document.querySelectorAll('.counter');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || '0');
      let count = 0;
      const duration = 2000; // ms
      const frameRate = 30; // ms
      const increment = Math.ceil(target / (duration / frameRate));
      
      const updateCount = () => {
        if (count < target) {
          count += increment;
          if (count > target) count = target;
          counter.textContent = count.toString();
          setTimeout(updateCount, frameRate);
        } else {
          counter.textContent = target.toString();
        }
      };
      
      updateCount();
    });
  }
}
