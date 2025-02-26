export class Physics {
  private width: number;
  private height: number;
  rocket: Rocket;
  target: Target;

  // Constants for the simulation
  private c: number = 0.47; // Drag coefficient
  private r: number = 0.05; // Projectile radius (m)
  private A: number = Math.PI * this.r ** 2; // Area (m^2)
  private m: number = 0.2; // Mass (kg)
  private rho_air: number = 1.28; // Air density (kg/m^3)
  private g: number = 9.81; // Acceleration due to gravity (m/s^2)
  private k: number = 0.5 * this.c * this.rho_air * this.A; // Constant for drag force

  // State of the rocket (position and velocity)
  private u: number[] = [0, 0, 0, 0]; // [x, xdot, z, zdot]
  private t: number = 0; // Current simulation time

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.rocket = {
      x: 50,
      y: height - 50,
      size: 20,
    };

    this.target = {
      x: width - 50,
      y: 50,
      radius: 15,
      angle: 0,
      speed: 0.02,
      radius_orbit: 50,
    };
  }

  // Derivative function to calculate the rates of change
  private deriv(t: number, u: number[]): number[] {
    const [x, xdot, z, zdot] = u;
    const speed = Math.hypot(xdot, zdot);
    const xdotdot = (-this.k / this.m) * speed * xdot;
    const zdotdot = (-this.k / this.m) * speed * zdot - this.g;
    return [xdot, xdotdot, zdot, zdotdot];
  }

  // Numerical integration using Euler's method
  private eulerStep(t: number, u: number[], dt: number): number[] {
    const derivatives = this.deriv(t, u);
    return u.map((value, index) => value + derivatives[index] * dt);
  }

  // Simulate the rocket's motion and return the updated x and y positions
  simulate(dt: number = 0.01): { x: number; y: number } {
    // Perform one step of the simulation
    this.u = this.eulerStep(this.t, this.u, dt);
    this.t += dt;

    // Return the updated x and y positions
    return {
      x: this.u[0], // x position
      y: this.height - this.u[2], // y position (inverted for display)
    };
  }

  // Update the rocket's position and check for collisions or out-of-bounds
  update(angle: number, speed: number): boolean {
    // If the simulation hasn't started yet, initialize the state
    if (this.t === 0) {
      const phi0 = (angle * Math.PI) / 180; // Convert angle to radians
      const v0 = speed; // Initial speed
      this.u = [0, v0 * Math.cos(phi0), 0, v0 * Math.sin(phi0)]; // Initial conditions [x, xdot, z, zdot]
    }

    // Simulate the rocket's motion and get the updated position
    const newPos = this.simulate();

    // Update the rocket's position
    this.rocket.x = newPos.x;
    this.rocket.y = newPos.y;

    // Update target position (circular orbit)
    this.target.angle += this.target.speed;
    this.target.x = this.width - 100 + Math.cos(this.target.angle) * this.target.radius_orbit;
    this.target.y = 100 + Math.sin(this.target.angle) * this.target.radius_orbit;

    // Check if the rocket is out of bounds
    const isOutOfBounds =
      this.rocket.x > this.width ||
      this.rocket.x < 0 ||
      this.rocket.y > this.height ||
      this.rocket.y < 0;

    // Check if the rocket has hit the target
    const dx = this.rocket.x - this.target.x;
    const dy = this.rocket.y - this.target.y;
    const distance = Math.hypot(dx, dy);
    const hasHitTarget = distance < this.target.radius + this.rocket.size / 2;

    // Return true if the rocket is out of bounds or has hit the target
    return isOutOfBounds || hasHitTarget;
  }

  reset() {
    this.rocket.x = this.width / 2;
    this.rocket.y = this.height - 20;
    this.target.angle = 0;
    this.u = [0, 0, 0, 0]; // Reset state
    this.t = 0; // Reset simulation time
  }
}