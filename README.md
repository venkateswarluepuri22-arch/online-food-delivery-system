<<<<<<< HEAD
# online-food-delivery-system
online order
=======
# 🍲 CampusBite - Online College Canteen Portal

A modern, full-stack College Canteen web application built with **React**, **Node.js/Express**, and **MongoDB / Persistent JSON Store**. It delivers a single unified portal serving both frontend and backend on port **5001** (avoiding macOS AirPlay collisions on 5000), allowing multiple computers, laptops, and mobile phones to order food in real-time.

---

## 🚀 How to Run (1-Click)

### On macOS / Linux
Open Terminal in the project root and run:
```bash
npm start
```
*(Or run `npm run server` to start the backend directly).*

### On Windows
Double-click:
```
start-portal.bat
```
*(Or run `npm start` in PowerShell / Command Prompt).*

---

## 🌐 Shareable Access Links

When you run `npm start`, CampusBite generates multiple access options:

1. **Local Access (This Computer):**
   ```
   http://localhost:5001
   ```

2. **Same Wi-Fi Network Link (For phones & laptops on your Wi-Fi):**
   ```
   http://<your-wifi-ip>:5001
   ```
   *(e.g., `http://192.168.1.5:5001` - anyone on your Wi-Fi can open this in their mobile browser to order!)*

3. **Global Public Link (Share anywhere via Cloudflare / Localtunnel):**
   ```
   https://<generated-subdomain>.trycloudflare.com
   ```

---

## 🍽️ 32 Delicious Campus Food Items Included

The menu is fully loaded with 32 mouth-watering dishes across 5 categories:

- **🥞 Breakfast:** Masala Dosa, Idli Vada Combo, Puri Bhaji, Chole Bhature, Egg Cheese Omelette Pav, Poha with Sev & Peanuts, Onion Uttapam.
- **🍛 Lunch & Meals:** Hyderabadi Veg Dum Biryani, Chicken Dum Biryani, Paneer Butter Masala & Roti, South Indian Special Thali, Veg Fried Rice & Manchurian, Chicken Fried Rice & Chilli Chicken, Dal Makhani with Garlic Naan, Rajma Chawal Bowl.
- **🥪 Snacks & Street Food:** Hot Samosa (2 pcs), Grilled Veg Cheese Sandwich, Crispy Paneer Burger, Crispy Chicken Burger, Mumbai Pav Bhaji, Peri Peri French Fries, Cheese Maggi Deluxe, Crispy Veg Spring Rolls, Veg Hakka Noodles.
- **🍨 Desserts & Sweets:** Hot Gulab Jamun, Royal Rasmalai, Brownie with Vanilla Ice Cream.
- **🥤 Drinks & Shakes:** South Indian Filter Coffee, Kulhad Masala Chai, Chilled Mango Lassi, Cold Coffee with Vanilla Ice Cream, Fresh Mint Lime Soda.

Each item includes dietary indicators (🟢 Veg / 🔴 Non-Veg), ratings (⭐ 4.5 – 4.9), preparation times, prices in Indian Rupees (₹), and in-card quantity steppers.

---

## 🔑 Demo Test Accounts (1-Click Login Built In)

You can log in directly using the 1-Click buttons on the `/login` page or use these credentials:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | `student@canteen.edu` | `student123` | Browse menu, filter veg/category, add to tray, place orders, live visual tracker |
| **⚙️ Admin** | `admin@canteen.edu` | `admin123` | Real-time queue, change status (`PREPARING`, `READY`, etc.), add/edit food items |

---

## 🎨 Unique Modern Styling & Features

- **Appetizing Foodie Aesthetic:** Warm saffron, terracotta, emerald veg badges, and glassmorphic card design.
- **Interactive Menu:** Live search, category filter pills, `🟢 Pure Veg Only` toggle, and price/rating sorting.
- **Direct Card Controls:** Add to cart or adjust quantities (`−` `+`) right from the food card without navigating away.
- **Live Order Progress Tracker:** Real-time visual stepper (`PLACED` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`) with unique Token Numbers for kitchen counter pickup.
- **Dual-Engine Persistence:** Connects to MongoDB automatically if available, with instantaneous fallback to local persistent JSON store (`canteen_data.json`) if MongoDB is not running — **100% uptime with zero crashes or timeouts!**
>>>>>>> 79cf70e (first commit)
