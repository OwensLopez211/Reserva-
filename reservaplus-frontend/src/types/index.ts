
// Base types for the application
export interface Organization {
    id: string;
    name: string;
    slug: string;
    // Add more fields as needed
  }
  
  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organization: Organization;
  }
  
  // Add more types as needed