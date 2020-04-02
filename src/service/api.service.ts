import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  getWaterQualityPro() {
    return this.http.get('../assets/data/waterQualitypros.json');
  }

  getRedline() {
    return this.http.get('../assets/data/redline.json');
  }
  getBuildings() {
    return this.http.get('../assets/data/buildings.geojson');
  }
  getWaterFace() {
    return this.http.get('../assets/data/water.json');
  }
  getUnderWater() {
    return this.http.get('../assets/data/depthIDW.json');
  }
}
