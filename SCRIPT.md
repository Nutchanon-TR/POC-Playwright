1. เปิดหน้า `https://corpadmin-dev.se.scb.co.th/login`
2. กดปุ่ม `Accept`
3. กดปุ่ม `windows Sign in with Microsoft`
4. กดช่อง `Enter your email, phone, or`
5. กรอกอีเมล `corporatereport02@scbcorp.onmicrosoft.com`
6. กดปุ่ม `Next`
7. กดช่อง `Enter the password for`
8. กรอกรหัสผ่าน
9. กดปุ่ม `Sign in`
10. กดปุ่ม `Yes`
11. ตรวจสอบว่าเจอ `Corporate Admin Portal`
12. กดเมนู `Corporate Report`
13. กดเมนู `Corporate Profiles`
14. กดปุ่ม `plus Add New`
15. ตรวจสอบว่าเจอหัวข้อ `Corporate Profile Details`
16. กรอก `* Corporate ID :` ด้วยค่า `SFTP-{idSuffix}`
17. กรอก `* Corporate Name (Thai) :`
18. กรอก `* Corporate Name (English) :` ด้วยค่า `Autotest SFTP`
19. กรอก `Remark :` ด้วยค่า `Created by Playwright SFTP flow`
20. กดปุ่ม `plus Submit`
21. ตรวจสอบว่าเจอข้อความ `Your submission is pending approval.`
22. กดปุ่ม `OK`
23. กดปุ่ม `plus Add New`
24. ตรวจสอบว่าเจอหัวข้อ `Corporate Profile Details`
25. กรอก `* Corporate ID :` ด้วยค่า `EMAIL-{idSuffix}`
26. กรอก `* Corporate Name (Thai) :`
27. กรอก `* Corporate Name (English) :` ด้วยค่า `Autotest EMAIL`
28. กดตัวเลือก `Email`
29. กรอก `Enter tax id`
30. กรอกอีเมล `corporate-report+autotest@scb.co.th` แล้วกด `Enter`
31. กรอกอีเมล `hello@gmail.com` แล้วกด `Enter`
32. ติ๊ก `Round 1 (09.00)`
33. กรอก `Remark :` ด้วยค่า `Created by Playwright EMAIL flow`
34. กดปุ่ม `plus Submit`
35. กดปุ่ม `OK`
36. กดเมนู `Corporate Report`
37. กดเมนู `Incoming Profiles`
38. กดปุ่ม `plus Add New`
39. ตรวจสอบว่าเจอหัวข้อ `Incoming Profile Details`
40. กดช่อง `* Corporate Id :`
41. เลือก Corporate Id ตัวแรกจาก dropdown
42. กรอก `Enter Account No` ด้วยเลข 10 หลักรายการที่ 1
43. กรอก `Select Date` ด้วยวันที่ปัจจุบันรูปแบบ `DD/MM/YYYY`
44. กด `Tab`
45. กรอก `Enter Remark` ด้วยค่า `Created by Playwright Incoming approve flow`
46. กดปุ่ม `plus Submit`
47. กดปุ่ม `OK`
48. กดปุ่ม `plus Add New`
49. ตรวจสอบว่าเจอหัวข้อ `Incoming Profile Details`
50. กดช่อง `* Corporate Id :`
51. เลือก Corporate Id ตัวแรกจาก dropdown
52. กรอก `Enter Account No` ด้วยเลข 10 หลักรายการที่ 2
53. กรอก `Select Date` ด้วยวันที่ปัจจุบันรูปแบบ `DD/MM/YYYY`
54. กด `Tab`
55. กรอก `Enter Remark` ด้วยค่า `Created by Playwright Incoming reject flow`
56. กดปุ่ม `plus Submit`
57. กดปุ่ม `OK`
58. กด `Sign Out`
59. กดปุ่ม `Sign Out`
60. ตรวจสอบว่ากลับมาหน้า `login`
61. กดปุ่ม `Accept`
62. กดปุ่ม `windows Sign in with Microsoft`
63. กดปุ่ม `Use another account`
64. กดช่อง `Enter your email, phone, or`
65. กรอกอีเมล `corporatereport04@scbcorp.onmicrosoft.com`
66. กดปุ่ม `Next`
67. กดช่อง `Enter the password for`
68. กรอกรหัสผ่าน
69. กดปุ่ม `Sign in`
70. ตรวจสอบว่าเจอ `Corporate Admin Portal`
71. กดเมนู `Corporate Report`
72. กดเมนู `Pending Requests`
73. กดเมนู `Corporate`
74. ไปหน้าสุดท้ายของ pagination ถ้ามี
75. หา record `EMAIL-{idSuffix}` ที่มี remark `Created by Playwright EMAIL flow`
76. กด `Approve`
77. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
78. กดเมนู `Corporate Report`
79. กดเมนู `Pending Requests`
80. กดเมนู `Corporate`
81. ไปหน้าสุดท้ายของ pagination ถ้ามี
82. หา record `SFTP-{idSuffix}` ที่มี remark `Created by Playwright SFTP flow`
83. กด `Reject`
84. ถ้ามี dialog ให้กรอกเหตุผล `Rejected SFTP from automated testing`
85. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
86. กดเมนู `Corporate Report`
87. กดเมนู `Pending Requests`
88. กดเมนู `Incoming`
89. ไปหน้าสุดท้ายของ pagination ถ้ามี
90. หา record ที่มี remark `Created by Playwright Incoming approve flow`
91. กด `Approve`
92. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
93. กดเมนู `Corporate Report`
94. กดเมนู `Pending Requests`
95. กดเมนู `Incoming`
96. ไปหน้าสุดท้ายของ pagination ถ้ามี
97. หา record ที่มี remark `Created by Playwright Incoming reject flow`
98. กด `Reject`
99. ถ้ามี dialog ให้กรอกเหตุผล `Rejected Incoming from automated testing`
100. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
101. กด `Sign Out`
102. กดปุ่ม `Sign Out`
103. ตรวจสอบว่ากลับมาหน้า `login`
104. กดปุ่ม `Accept`
105. กดปุ่ม `windows Sign in with Microsoft`
106. กดช่อง `Enter your email, phone, or`
107. กรอกอีเมล `corporatereport02@scbcorp.onmicrosoft.com`
108. กดปุ่ม `Next`
109. กดช่อง `Enter the password for`
110. กรอกรหัสผ่าน
111. กดปุ่ม `Sign in`
112. กดปุ่ม `Yes`
113. ตรวจสอบว่าเจอ `Corporate Admin Portal`
114. กดเมนู `Corporate Report`
115. กดเมนู `Corporate Profiles`
116. ค้นหา `Corporate ID` ด้วยค่า `EMAIL-{idSuffix}`
117. กดปุ่ม `Search`
118. หา row ของ `EMAIL-{idSuffix}`
119. กด `Edit`
120. ตรวจสอบว่าเจอหัวข้อ `Corporate Profile Details`
121. แก้ `* Corporate Name (English) :` เป็น `Autotest EMAIL Updated`
122. แก้ `Remark :` เป็น `Edited by Playwright EMAIL flow`
123. กดปุ่ม `Save`
124. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
125. กดปุ่ม `OK`
126. กดเมนู `Corporate Report`
127. กดเมนู `Incoming Profiles`
128. ค้นหา `Search By Allow Account` ด้วยเลขบัญชีรายการที่ approve
129. กดปุ่ม `Search`
130. หา row ของ Incoming ที่มี remark `Created by Playwright Incoming approve flow`
131. กด `Edit`
132. ตรวจสอบว่าเจอหัวข้อ `Incoming Profile Details`
133. เปลี่ยนสถานะเป็น `Inactive`
134. แก้ `Enter Remark` เป็น `Edited by Playwright Incoming flow`
135. กดปุ่ม `Submit`
136. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
137. กดปุ่ม `OK`
138. กด `Sign Out`
139. กดปุ่ม `Sign Out`
140. ตรวจสอบว่ากลับมาหน้า `login`
141. กดปุ่ม `Accept`
142. กดปุ่ม `windows Sign in with Microsoft`
143. กดปุ่ม `Use another account`
144. กดช่อง `Enter your email, phone, or`
145. กรอกอีเมล `corporatereport04@scbcorp.onmicrosoft.com`
146. กดปุ่ม `Next`
147. กดช่อง `Enter the password for`
148. กรอกรหัสผ่าน
149. กดปุ่ม `Sign in`
150. ตรวจสอบว่าเจอ `Corporate Admin Portal`
151. กดเมนู `Corporate Report`
152. กดเมนู `Pending Requests`
153. กดเมนู `Corporate`
154. ไปหน้าสุดท้ายของ pagination ถ้ามี
155. หา record `EMAIL-{idSuffix}` ที่มี remark `Edited by Playwright EMAIL flow` และ action type เป็น `Update/Edit`
156. กด `Approve`
157. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
158. กดเมนู `Corporate Report`
159. กดเมนู `Pending Requests`
160. กดเมนู `Incoming`
161. ไปหน้าสุดท้ายของ pagination ถ้ามี
162. หา record ที่มี remark `Edited by Playwright Incoming flow` และ action type เป็น `Update/Edit`
163. กด `Approve`
164. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
165. กด `Sign Out`
166. กดปุ่ม `Sign Out`
167. ตรวจสอบว่ากลับมาหน้า `login`
168. กดปุ่ม `Accept`
169. กดปุ่ม `windows Sign in with Microsoft`
170. กดช่อง `Enter your email, phone, or`
171. กรอกอีเมล `corporatereport02@scbcorp.onmicrosoft.com`
172. กดปุ่ม `Next`
173. กดช่อง `Enter the password for`
174. กรอกรหัสผ่าน
175. กดปุ่ม `Sign in`
176. กดปุ่ม `Yes`
177. ตรวจสอบว่าเจอ `Corporate Admin Portal`
178. กดเมนู `Corporate Report`
179. กดเมนู `Corporate Profiles`
180. ค้นหา `Corporate ID` ด้วยค่า `EMAIL-{idSuffix}`
181. กดปุ่ม `Search`
182. ตรวจสอบว่า row มีค่า `Autotest EMAIL Updated`
183. ตรวจสอบว่า row มีค่า `Edited by Playwright EMAIL flow`
184. กด `Delete`
185. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
186. กดเมนู `Corporate Report`
187. กดเมนู `Incoming Profiles`
188. ค้นหา `Search By Allow Account` ด้วยเลขบัญชีรายการที่ approve
189. กดปุ่ม `Search`
190. ตรวจสอบว่า row มีค่า `Edited by Playwright Incoming flow`
191. ตรวจสอบว่า row มีสถานะ `Inactive`
192. กด `Delete`
193. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
194. กด `Sign Out`
195. กดปุ่ม `Sign Out`
196. ตรวจสอบว่ากลับมาหน้า `login`
197. กดปุ่ม `Accept`
198. กดปุ่ม `windows Sign in with Microsoft`
199. กดปุ่ม `Use another account`
200. กดช่อง `Enter your email, phone, or`
201. กรอกอีเมล `corporatereport04@scbcorp.onmicrosoft.com`
202. กดปุ่ม `Next`
203. กดช่อง `Enter the password for`
204. กรอกรหัสผ่าน
205. กดปุ่ม `Sign in`
206. ตรวจสอบว่าเจอ `Corporate Admin Portal`
207. กดเมนู `Corporate Report`
208. กดเมนู `Pending Requests`
209. กดเมนู `Corporate`
210. ไปหน้าสุดท้ายของ pagination ถ้ามี
211. หา record `EMAIL-{idSuffix}` ที่มี remark `Edited by Playwright EMAIL flow` และ action type เป็น `Delete`
212. กด `Approve`
213. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
214. กดเมนู `Corporate Report`
215. กดเมนู `Pending Requests`
216. กดเมนู `Incoming`
217. ไปหน้าสุดท้ายของ pagination ถ้ามี
218. หา record ที่มี remark `Edited by Playwright Incoming flow` และ action type เป็น `Delete`
219. กด `Approve`
220. ถ้ามี dialog ยืนยัน ให้กดปุ่มยืนยัน
221. กด `Sign Out`
222. กดปุ่ม `Sign Out`
