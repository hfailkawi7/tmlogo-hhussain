/* ساعة الغدر — character icons (line icons, 24×24). */
(function (root) {
'use strict';
var P = {
  'الطبيب': '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8"/>',
  'المحقّق': '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5M8 10.5a2.5 2.5 0 0 1 2.5-2.5"/>',
  'الحارس الشخصي': '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9 12l2 2 4-4"/>',
  'القاضي': '<path d="M12 4v16M7 20h10M5 7h14M5 7l-3 6h6zM19 7l-3 6h6z"/>',
  'الصيّاد': '<path d="M6 3c8 3 8 15 0 18M6 3v18M3 12h17M17 9l3 3-3 3"/>',
  'الشرطي': '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  'العمدة': '<path d="M12 3l8 5H4zM5 10h14M7 10v8M12 10v8M17 10v8M4 18h16M3 21h18"/>',
  'صاحب الغراب': '<path d="M4 18c4 0 7-2 8-6l3-5h3l1 2-3 1c0 6-5 10-12 8z"/><path d="M9 19l-1 2M13 18l1 2"/><circle cx="16" cy="8.5" r=".5"/>',
  'الجندي': '<path d="M4 15a8 8 0 0 1 16 0z"/><path d="M2 15h20M8 15v3a4 4 0 0 0 8 0v-3"/>',
  'الجدّة': '<circle cx="7" cy="14" r="3.5"/><circle cx="17" cy="14" r="3.5"/><path d="M10.5 14h3M3.5 13L2 8M20.5 13L22 8"/>',
  'السجّان': '<circle cx="8" cy="8" r="4"/><path d="M11 11l9 9M16 16l2-2M18.5 18.5l2-2"/>',
  'المحامي': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18M11 12v2h2v-2"/>',
  'المُسعِف': '<path d="M12 20s-8-4.5-8-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.5-8 10-8 10z"/><path d="M6 12h3l1.5-2.5 2 5 1.5-2.5H18"/>',
  'الحارس الليلي': '<path d="M9 3h6M12 3v2M7 7h10l-1 12H8zM6 21h12"/><path d="M12 10.5c1.5 1.2 1.5 3 0 4.5-1.5-1.5-1.5-3.3 0-4.5z"/>',
  'الطبّاخ': '<path d="M7 14a4 4 0 0 1-1-7.8A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 6 2.2A4 4 0 0 1 17 14z"/><path d="M7 14v6h10v-6M7 17h10"/>',
  'المراقب': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'العجوز': '<circle cx="12" cy="10" r="7"/><path d="M7 20h10M8.5 16l-1.5 4M15.5 16l1.5 4M9 8a3 3 0 0 1 3-2.5"/>',
  'الخيّاطة': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.2 8.2L20 20M8.2 15.8L20 4"/>',
  'القائد': '<path d="M5 21V4M5 4h13l-2.5 4 2.5 4H5"/>',
  'صانع المرايا': '<ellipse cx="12" cy="9" rx="6" ry="6.5"/><path d="M12 15.5V21M9.5 21h5M9.5 7.5a3 3 0 0 1 2-2"/>',
  'الزعيم': '<path d="M3 18h18l-2-10-5 4-2-6-2 6-5-4z"/><path d="M4 21h16"/>',
  'الجاسوس': '<path d="M3 11h18M6 11l1.5-6h9L18 11"/><circle cx="8.5" cy="16" r="2.5"/><circle cx="15.5" cy="16" r="2.5"/><path d="M11 16h2"/>',
  'المُخادع': '<path d="M3 8c3-2 15-2 18 0 0 6-3 10-9 10S3 14 3 8z"/><path d="M7 11c1-1 2.5-1 3.5 0M13.5 11c1-1 2.5-1 3.5 0M9.5 14.5c1.5 1 3.5 1 5 0"/>',
  'المُسكِت': '<path d="M4 5h16v11H9l-5 4z"/><path d="M3 3l18 18"/>',
  'الوريث': '<path d="M8 4h10a2 2 0 0 1 2 2v1h-3M8 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7M8 4a2 2 0 0 1 2 2v1"/><path d="M10 11h6M10 14h6M10 17h3"/>'
};
var EVIL = { 'الزعيم': 1, 'الجاسوس': 1, 'المُخادع': 1, 'المُسكِت': 1, 'الوريث': 1 };
/* icon(role, size) → HTML: the line icon inside a team-coloured circle */
function icon(role, size) {
  size = size || 40;
  var ev = EVIL[role], fg = ev ? '#F08A84' : '#8FC0F5', bg = ev ? '#3A1D1F' : '#1E3354';
  var inner = Math.round(size * 0.58);
  return '<span class="ic" style="width:' + size + 'px;height:' + size + 'px;border-radius:999px;background:' + bg + ';display:inline-flex;align-items:center;justify-content:center;flex:none">' +
    '<svg width="' + inner + '" height="' + inner + '" viewBox="0 0 24 24" fill="none" stroke="' + fg + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[role] || '<circle cx="12" cy="12" r="8"/>') + '</svg></span>';
}
root.CTIcon = icon;
})(typeof window !== 'undefined' ? window : globalThis);
