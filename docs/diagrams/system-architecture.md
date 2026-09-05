# System Architecture Pipeline

The following diagram illustrates the complete request lifecycle and architectural pipeline of the DineEase application, from the frontend client to the backend database.

```mermaid
flowchart TD
    Client[React Client] -->|API Request| Axios[Axios Instance]
    Axios -->|HTTP Request| Server[Express Route]
    Server --> Validator[Input Validators]
    Validator -->|Valid Data| Auth[Authenticate Middleware]
    Auth -->|Valid Token| Authorize[Authorize Middleware]
    Authorize -->|Role Allowed| Controller[Controller Layer]
    Controller --> Service[Service Layer]
    Service --> Model[Mongoose Model]
    Model -->|Read/Write| MongoDB[(MongoDB)]
    MongoDB -->|Data| Model
    Model --> Service
    Service --> Controller
    Controller -->|JSON Response| Client
```
