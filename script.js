function verifyJBS() {
    const inputId = document.getElementById("jbs-input").value.trim().toUpperCase();
    const errorMsg = document.getElementById("error-msg");
    
    // البحث في قاعدة البيانات
    const user = mockDatabase.find(u => u.id === inputId);

    if (!user) {
        errorMsg.style.display = "block";
        errorMsg.innerHTML = "عذراً، رقم الاستشارية غير موجود. يرجى التأكد من الرقم.";
        return;
    }

    if (!currentJobAllowedMajors.includes(user.major)) {
        errorMsg.style.display = "block";
        errorMsg.innerHTML = `عذراً لا يمكنك التقديم. اختصاصك المسجل هو (<b>${user.major}</b>)، والاختصاصات المطلوبة لهذه الوظيفة هي: (<b>${currentJobAllowedMajors.join("، ")}</b>).`;
        return;
    }

    // --- توزيع الاسم على المربعات وجعلها قابلة للتعديل ---
    const nameParts = user.name.split(" "); 
    document.getElementById("fname").value = nameParts[0] || ""; // الاسم الأول
    document.getElementById("sname").value = nameParts[1] || ""; // الاسم الثاني
    document.getElementById("tname").value = nameParts[2] || ""; // الاسم الثالث
    
    // إذا كان الاسم رباعياً، ضع الباقي في حقل اللقب
    if (nameParts.length > 3) {
        document.getElementById("lname").value = nameParts.slice(3).join(" ");
    } else {
        document.getElementById("lname").value = "";
    }

    // جلب الاختصاص (هذا مقفول من الـ HTML)
    document.getElementById("u-major").value = user.major;
    
    // جلب الجامعة (قابلة للتعديل)
    document.getElementById("u-uni").value = user.uni;
    
    errorMsg.style.display = "none";
    goToSlide(2);
}

function goToSlide(slideNumber) {
    document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
    document.getElementById('slide-' + slideNumber).classList.add('active');

    for (let i = 1; i <= 4; i++) {
        const nav = document.getElementById('step-nav-' + i);
        if (i < slideNumber) {
            nav.classList.add('completed');
            nav.classList.remove('active');
        } else if (i === slideNumber) {
            nav.classList.add('active');
            nav.classList.remove('completed');
        } else {
            nav.classList.remove('active', 'completed');
        }
    }
}
