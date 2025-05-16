// chef-projet-layout.component.ts
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChefProjetNavbarComponent } from '../../../components/chef-projetComponents/chef-projet-navbar/chef-projet-navbar.component';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';

@Component({
  selector: 'app-chef-projet-layout',
  templateUrl: './chef-projet-layout.component.html',
  styleUrls: ['./chef-projet-layout.component.scss'],
  standalone: true,
  imports: [RouterModule, ChefProjetNavbarComponent, TopBarComponent],
})
export class ChefProjetLayoutComponent {}
