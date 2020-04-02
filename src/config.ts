class Config {
  mapConfig: any;
  constructor() {
    this.mapConfig = {
      google: `http://www.google.cn/maps/vt?lyrs=s&x={x}&y={y}&z={z}`,
      patrol_myb_20190626: `http://140.207.79.138:5080/geoserver/gwc/service/tms/1.0.0/kalends%3Apatrol_myb_20190626@EPSG%3A900913@png/{z}/{x}/{reverseY}.png`,
      TPModelUrl: `http://140.207.79.138:6080/youku/tileset.json`,
      ModelUrl: `http://localhost:8085/SceneX/tileset.json`,
      gturl: 'assets/3dtiles/buildings_sh/tileset.json'
    };


  }

}

export const config = new Config();

