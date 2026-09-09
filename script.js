function verifyJBS() {
    const inputId = document.getElementById("jbs-input").value.trim().toUpperCase();
    const errorMsg = document.getElementById("error-msg");
    
    // البحث عن المتقدم في قاعدة البيانات (تأتي من ملف database.js)
    const user = mockDatabase.find(u => u.id === inputId);

    if (!user) {
        errorMsg.style.display = "block";
        errorMsg.innerHTML = "عذراً، رقم الاستشارية غير موجود في قاعدة البيانات. يرجى التأكد من الرقم.";
        return;
    }

    // التحقق من الاختصاص (المنع المباشر بالاعتماد على المصفوفة في database.js)
    if (!currentJobAllowedMajors.includes(user.major)) {
        errorMsg.style.display = "block";
        errorMsg.innerHTML = `عذراً لا يمكنك التقديم. اختصاصك المسجل هو (<b>${user.major}</b>)، والاختصاصات المطلوبة لهذه الوظيفة هي: (<b>${currentJobAllowedMajors.join("، ")}</b>).`;
        return;
    }

    // إذا تطابق الاختصاص، يتم جلب البيانات للانتقال للسلايد الثاني
    document.getElementById("u-name").value = user.name;
    document.getElementById("u-major").value = user.major;
    document.getElementById("u-phone").value = user.phone;
    document.getElementById("u-uni").value = user.uni;
    
    errorMsg.style.display = "none";
    goToSlide(2);
}

function goToSlide(slideNumber) {
    // التحقق من اختيار الاختصاص الدقيق قبل الانتقال للمستندات
    if (slideNumber === 3) {
        const precise = document.getElementById("precise-major").value;
        if(precise === "") {
            alert("يرجى تحديد اختصاصك الدقيق أو مجال خبرتك قبل الاستمرار.");
            return;
        }
    }

    // إخفاء جميع السلايدات
    document.querySelectorAll('.slide').forEach(el => el.classList.remove('active'));
    // إظهار السلايد المطلوب
    document.getElementById('slide-' + slideNumber).classList.add('active');

    // تحديث شريط التقدم
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
