ล็อคอินด้วย EntraAD
- ได้ Graph Token
- ได้ MSAL instant -> ตั้ง account สำหรับใช้ข้อมูล user จาก msal 
ถ้าล้มเหลว
- ลบ instant, acccount ออก
- บังคับ logout

API
ต้องใช้ graph token (ที่ได้จากการ login) แนบไปทุกครั้ง เพื่อ verify ก่อนเข้าถึงข้อมูล


