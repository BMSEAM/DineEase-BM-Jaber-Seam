# DineEase — Class Diagram (§14)

Software-generated (Mermaid) class diagram of the domain model. Render on GitHub,
in VS Code (Markdown Preview Mermaid), or at <https://mermaid.live>.

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String phone
        -String password
        +String role
        +Boolean isActive
        +Number loyaltyPoints
        +comparePassword(candidate) Boolean
        +toJSON() Object
    }

    class MenuCategory {
        +ObjectId _id
        +String name
        +String description
        +Number displayOrder
        +Boolean isActive
    }

    class MenuItem {
        +ObjectId _id
        +String name
        +String description
        +Number price
        +ObjectId category
        +String imageUrl
        +Boolean isAvailable
    }

    class RestaurantTable {
        +ObjectId _id
        +String tableNumber
        +Number capacity
        +String seatingPreference
        +String status
        +Boolean isActive
    }

    class Reservation {
        +ObjectId _id
        +ObjectId customer
        +ObjectId table
        +String date
        +String startTime
        +String endTime
        +Date startAt
        +Date endAt
        +Number guests
        +String seatingPreference
        +String status
        +ObjectId order
        +approve()
        +reject(reason)
        +cancel()
    }

    class Order {
        +ObjectId _id
        +ObjectId customer
        +ObjectId reservation
        +String type
        +OrderItem[] items
        +Number subtotal
        +String status
        +Boolean isPaid
        +advanceStatus(next)
    }

    class OrderItem {
        +ObjectId menuItem
        +String name
        +Number unitPrice
        +Number quantity
        +Number lineTotal
    }

    class Payment {
        +ObjectId _id
        +ObjectId order
        +ObjectId customer
        +String method
        +String transactionRef
        +Number amount
        +Number pointsRedeemed
        +Number discountApplied
        +String status
        +Date paidAt
    }

    class Invoice {
        +ObjectId _id
        +String invoiceNumber
        +ObjectId order
        +ObjectId payment
        +ObjectId customer
        +Number subtotal
        +Number discount
        +Number vat
        +Number total
        +String paymentMethod
        +String transactionRef
    }

    class Review {
        +ObjectId _id
        +ObjectId customer
        +ObjectId reservation
        +Number rating
        +String comment
    }

    class Favourite {
        +ObjectId _id
        +ObjectId customer
        +ObjectId menuItem
    }

    class Notification {
        +ObjectId _id
        +ObjectId user
        +String type
        +String title
        +String message
        +Boolean isRead
    }

    class CleaningTask {
        +ObjectId _id
        +ObjectId table
        +ObjectId reservation
        +ObjectId raisedBy
        +ObjectId cleaner
        +String status
        +Date startedAt
        +Date completedAt
    }

    class LoyaltyTransaction {
        +ObjectId _id
        +ObjectId customer
        +String type
        +Number points
        +Number balanceAfter
        +ObjectId payment
    }

    User "1" --> "0..*" Reservation : makes
    User "1" --> "0..*" Review : writes
    User "1" --> "0..*" Notification : receives
    User "1" --> "0..*" LoyaltyTransaction : earns/redeems
    MenuCategory "1" --> "0..*" MenuItem : groups
    RestaurantTable "1" --> "0..*" Reservation : booked over time
    RestaurantTable "1" --> "0..*" CleaningTask : cleaned by
    Reservation "1" --> "0..1" Order : may have
    Order "1" *-- "1..*" OrderItem : contains
    OrderItem "1" --> "1" MenuItem : references
    Order "1" --> "0..1" Payment : paid by
    Payment "1" --> "1" Invoice : generates
    User "0..*" --> "0..*" MenuItem : favourites (via Favourite)
    Review "1" --> "1" Reservation : for
    CleaningTask "0..*" --> "1" User : raisedBy (waiter)
```

## Relationship summary

- One **User** → many **Reservations**, **Reviews**, **Notifications**, **LoyaltyTransactions**.
- One **MenuCategory** → many **MenuItems**.
- One **RestaurantTable** → many **Reservations** (over time) and **CleaningTasks**.
- One **Reservation** → zero or one **Order**.
- One **Order** → many **OrderItems**; each **OrderItem** → one **MenuItem**.
- One **Order** → zero or one **Payment**; one successful **Payment** → one **Invoice**.
- **Users** ↔ **MenuItems** many-to-many through **Favourite**.
