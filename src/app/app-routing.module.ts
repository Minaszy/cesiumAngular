import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { LayoutPageComponent } from './layout-page/layout-page.component';

const routes: Routes = [
  // { path: '', redirectTo: 'app-home', pathMatch: 'full' },
  { path: '', component: LoginComponent },
  { path: 'home', component: LayoutPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
