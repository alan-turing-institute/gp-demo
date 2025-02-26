export interface Rocket {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
}

export interface Target {
  x: number;
  y: number;
  radius: number;
  angle: number;
  speed: number;
  radius_orbit: number;f
}

export class Physics {
  private width: number;
  private height: number;
  rocket: Rocket;
  target: Target;

  constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      
      this.rocket = {
          x: 50,
          y: height - 50,
          size: 20,
          vx: 0,
          vy: 0
      };

      this.target = {
          x: width - 50,
          y: 50,
          radius: 15,
          angle: 0,
          speed: 0.02,
          radius_orbit: 50
      };
  }

  update(angle: number, speed: number): boolean {
      const radians = angle * Math.PI / 180;
      
      // Calculate and store velocity components
      this.rocket.vx = Math.cos(radians) * speed;
      this.rocket.vy = -Math.sin(radians) * speed;
      
      // Update position using the velocity
      this.rocket.x += this.rocket.vx;
      this.rocket.y += this.rocket.vy;
      
      // Update target position
      this.target.angle += this.target.speed;
      this.target.x = this.width - 100 + Math.cos(this.target.angle) * this.target.radius_orbit;
      this.target.y = 100 + Math.sin(this.target.angle) * this.target.radius_orbit;
      
      // Return true if rocket is out of bounds
      return (this.rocket.x > this.width || 
              this.rocket.x < 0 || 
              this.rocket.y > this.height || 
              this.rocket.y < 0);
  }

  reset() {
      this.rocket.x = this.width / 2;
      this.rocket.y = this.height;
      this.rocket.vx = 0;
      this.rocket.vy = 0;
      this.target.angle = 90;
  }
}