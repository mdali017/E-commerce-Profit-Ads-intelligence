# 🚀 Backend Local Run Guide (দ্রুত রান করার গাইড)

এই গাইডের মাধ্যমে আপনি খুব সহজে এবং মাত্র কয়েকটি কমান্ডের সাহায্যে লোকাল মেশিনে **FastAPI Backend** চালু করতে পারবেন।

---

## ⚡ কুইক স্টার্ট (Quick Start)

আপনার **PowerShell** বা **Terminal** ওপেন করে নিচের দুটি কমান্ড রান করুন:

```powershell
# ১. ব্যাকএন্ড ফোল্ডারে প্রবেশ করুন
cd backend

# ২. সার্ভার রান করুন (Auto-reload অনসহ)
.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

> **সাফল্য বার্তা:** টার্মিনালে নিচের মতো লেখা আসলে বুঝবেন সার্ভার সফলভাবে রানিং:
> `INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)`

---

## 🌐 প্রয়োজনীয় লাইভ ইউআরএল (Live Links)

সার্ভার চালু করার পর ব্রাউজারে নিচের লিংকগুলো চেক করতে পারেন:

| লিংক | ইউআরএল | কাজ |
| :--- | :--- | :--- |
| **Swagger UI Docs** | [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) | প্রতিটি API সরাসরি ব্রাউজার থেকে টেস্ট করা |
| **Health Check** | [http://localhost:8000/health](http://localhost:8000/health) | ডাটাবেস ও সার্ভারের কানেকশন স্ট্যাটাস দেখা |
| **API Root** | [http://localhost:8000/](http://localhost:8000/) | সার্ভার ভার্সন ও সার্ভিস ইনফো |
| **Redoc Docs** | [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc) | অল্টারনেটিভ ক্লিন ডকুমেন্টেশন |

---

## 🧪 স্বয়ংক্রিয় টেস্ট ও ডাটাবেস চেক

### ১. ডাটাবেস কানেকশন ও টেবিল চেক
ডাটাবেসে সব টেবিল ঠিকমতো তৈরি হয়েছে কি না তা দেখতে:
```powershell
cd backend
.venv\Scripts\python check_db.py
```

### ২. এন্ড-টু-এন্ড অটোমেটেড টেস্ট রান করা
Auth, Multi-Tenancy, এবং RBAC পারমিশন টেস্ট করতে:
```powershell
cd backend
.venv\Scripts\python test_server.py
```

---

## 🛑 সার্ভার বন্ধ করার নিয়ম
টার্মিনালে **`Ctrl + C`** চাপলে সার্ভার নিরাপদে বন্ধ হয়ে যাবে।

---

## 🛠️ সাধারণ সমস্যা ও সমাধান (Troubleshooting)

### সমস্যা ১: পোর্ট ৮০০০ অলরেডি ব্যস্ত দেখালে
যদি দেখায় `[Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000)`:
```powershell
# পূর্বের আটকে থাকা uvicorn প্রসেস কিল করুন
taskkill /IM uvicorn.exe /F

# অথবা পোর্ট ৮০০১ দিয়ে চালু করুন
.venv\Scripts\uvicorn app.main:app --reload --port 8001
```

### সমস্যা ২: ভার্চুয়াল এনভায়রনমেন্ট অ্যাক্টিভ করতে চাইলে
```powershell
cd backend
.venv\Scripts\Activate.ps1
```
*(যদি PowerShell স্ক্রিপ্ট রান পলিসি ব্লক করে, তবে সরাসরি `.venv\Scripts\uvicorn ...` ব্যবহার করাই সবচেয়ে নিরাপদ ও ঝামেলামুক্ত।)*
