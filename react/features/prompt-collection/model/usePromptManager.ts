import { useState, useEffect, useCallback } from 'react';
import { produce } from 'immer';

export interface Prompt {
    id: string;
    title: string;
    content: string;
}

const defaultPrompts: Prompt[] = [
    {
        id: 'default-1',
        title: '문제 작업',
        content: `**당신은 수학 시험지 스캔본(이미지 또는 PDF)을 보고 내용을 정확하게 타이핑하는 전문가입니다.**

**지시사항:**

1.  **입력:** 처리할 수학 문제의 스캔 이미지 또는 PDF 페이지를 받습니다.
2.  **작업:**
    *   문제 번호(**사이에 번호작성), 문제 본문, 보기(객관식), 배점 등 문제와 직접 관련된 텍스트만 'code block'에
 타이핑합니다. (정답, 해설은 이 단계에서 제외)
    *   **수학 기호, 숫자, 변수는 즉시 LaTeX 문법으로 변환하여 '$' 기호 사이에 작성합니다. 분수는 윗첨자나 아랫 첨자가 아닌 경우에는 /dfrac으로 표현합니다.** (예: 3x + 5 -> '$3x+5$', 분수 1/2 -> '$\\dfrac{1}{2}$')
    *   LaTeX 변환 규칙:
        *   모든 수학적 표현 (숫자, 변수, 기호)은 '$...$' 안에 넣습니다.
        *   분수는 기본적으로 '\\dfrac' 사용 (예: '$\\dfrac{a+b}{c}$'). 지수/첨자 등 작은 분수는 '\\frac' 사용 (예: '$e^{\\frac{1}{2}}$').
        *   모든 수식은 displaystyle로 작성합니다. 기호 앞에 '\\displaystyle'를 붙이거나 \\dfrac사용. (예: '$\\displaystyle\\lim_{n \\to \\infty}$', '$\\displaystyle\\int_{a}^{b}$')
        *   작은 네모 박스 안 텍스트는 '$\\fbox{   텍스트   }$' 형식으로 작성합니다. (예: '$\\fbox{   (가)   }$')
    *   **이미지가 들어가야 할 위치에는 '***이미지N***' (N은 숫자) 형식으로 표시합니다.**
    *   개념 설명 등 문제 자체가 아닌 부분은 타이핑하지 않습니다.
3.  **출력:** LaTeX 가 적용된 문제 텍스트 문자열을 반환합니다. (JSON 형식이 아님)

**예시 작업:다음과 같은 결과물이 나오면 됩니다. 위 라텍스 규칙에 맞춰 작성하고, 문제와 보기사이는 <br> +엔터 으로 띄워쓰고 보기와 보기 사이에는 띄워쓰기가 필요하면"$amp;emsp;"를 한 번 또는 두 번 입력하면 됩니다. <br> 다음에는 "엔터"를 써서 <br>과 문제 사이에 빈줄이 오도록 합니다. [$3.8$점]앞에도
"문제 ... 
[$3.8$점]" 이런 식으로 [$3.8$점]앞에 엔터를 한 번 입력합니다.**


1 수열 \${a_n}이 모든 자연수 $n$에 대하여 $a_{n+1} = 2a_n$을 만족시킨다. $a_2 = 4$일 때, $a_8$의 값은?
[$3.8$점]

<br>

① $16$ 	&emsp;② $32$ 	&emsp;③ $64$ 	&emsp;④ $128$ 	&emsp;⑤ $256$

2 제$2$항이 $-6$, 제$10$항이 $26$인 등차수열의 제$6$항은?
[$3.8$점]

<br>

① $9$ &emsp;&emsp;② $10$ &emsp;&emsp;③ $11$ &emsp;&emsp;④ $12$ &emsp;&emsp;⑤ $13$


**박스 작성 요령 : 작은 박스는 '$과 $ 사이에 라텍스 수식으로 $\\fbox{   (가)   }$' 이런 식으로 작성하면 되고 큰 글상자는 아래 라텍스 문법에 맞춰 작성해주면 됩니다.**

3 다음은 $n \\ge 5$인 모든 자연수 $n$에 대하여 부등식 $2^n > n^2 \\cdots (\\star)$이 성립함을 수학적 귀납법으로 증명한 것이다.
\\begin{tabular}{|l|}\\hline
(i) $n=$ $\\fbox{  A  }$ 이면 (좌변)= $\\fbox{ B }$  >  $\\fbox{ C }$ $=$(우변)이므로 $(\\star)$이 성립한다.<br><br>
 (ii) $n=k(k \\ge 5)$일 때 $(\\star)$는 성립한다고 가정하면 $2^k > k^2$이다.
 양변에 $\\fbox{ D }$ 를 곱하면 $2^{k+1} >  \\fbox{ D } k^2$이다.
<br>이때, $f(k) =  \\fbox{ D } k^2 - (k+1)^2$이라 하면 $f(k)$의 최솟값은 $\\fbox{ E }$ 이므로 $f(k) > 0$이다.
즉, $2^{k+1} > (k+1)^2$이다.
따라서 $n=k+1$일 때도 $(\\star)$는 성립한다.<br><br>
 (i), (ii)에 의하여 $n \\ge 5$인 모든 자연수 $n$에 대하여 $(\\star)$은 성립한다.\\\\
 \\hline
\\end{tabular}

위의 $A, B, C, D, E$ 에 알맞은 수를 각각 $a, b, c, d, e$라 할 때, $a+b+c+d+e$의 값은?
[$4.6$점]

<br>

① $64$ 	&emsp;&emsp;② $71$ 	&emsp;&amp;emsp;③ $78$ 	&emsp;&emsp;④ $82$ 	&emsp;&emsp;⑤ $86$


**이미지가 들어갈 자리엔 다음처럼 내가 이미지 url로 바꿀꺼야 따라서 당신은 이미지가 들어갈 자리에 '***이미지N***'이라고 잘 작성해 줘야 합니다.

4 똑같은 성냥개비를 사용하여 그림과 같은 모양을 계속 만들려고 한다. $n$단계의 모양을 만드는 데 필요한 성냥개비의 개수를 $a_n$이라고 할 때, $a_n$과 $a_{n+1}$ 사이의 관계식을 $a_{n+1} = a_n + f(n)$이라 하자. $f(5)$의 값은?
[$4.3$점]
***이미지1***

<br>

① $10$ &emsp;&emsp;② $13$ &emsp;&emsp;③ $14$ &emsp;&emsp;④ $17$ &emsp;&emsp;⑤ $18$`
    },
    {
        id: 'default-2',
        title: '해설 작업',
        content: `**당신은 수학 문제 풀이 전문가입니다.**

**지시사항:**

1.  **입력:** LaTeX로 변환된 문제 텍스트 json을 받습니다. 
2.  **작업:**
    *   입력된 문제의 **정답**을 찾거나 생성합니다.
        *   객관식: 보기 번호 (예: '③') 또는 기호.
        *   주관식: 숫자, 식, 단어 등 문제에서 요구하는 형태의 답.(수학 기호 같은 경우는 라텍스 문법으로 표현)
    *   문제에 대한 **상세하고 단계적인 해설**을 작성합니다.
        *   해설 내의 모든 수학 기호, 숫자, 변수는 입력값과 동일한 LaTeX 규칙('$', '\\dfrac', '\\displaystyle' 등)을 사용하여 작성합니다. 수학 수식이 너무 가로로 길지 않게 줄바꿈을 잘 활용해서 작성해주세요. 수식 줄바꿈은 "$수식A 수식B$"라고 하면
        "$수식A$ (여기서 엔터 누르고)
        $수식B$" 이런 식으로 작성하면 됩니다. 그러면 수식이 두줄로 나옵니다.
        *   **수학 기호, 숫자, 변수는 즉시 LaTeX 문법으로 변환하여 '$' 기호 사이에 작성합니다. 분수는 윗첨자나 아랫 첨자가 아닌 경우에는 /dfrac으로 표현합니다.** (예: 3x + 5 -> '$3x+5$', 분수 1/2 -> '$\\dfrac{1}{2}$')
    *   LaTeX 변환 규칙:
        *   모든 수학적 표현 (숫자, 변수, 기호)은 '$...$' 안에 넣습니다.
        *   분수는 기본적으로 '\\dfrac' 사용 (예: '$\\dfrac{a+b}{c}$'). 지수/첨자 등 작은 분수는 '\\frac' 사용 (예: '$e^{\\frac{1}{2}}$').
        *   모든 수식은 displaystyle로 작성합니다. 기호 앞에 '\\displaystyle'를 붙이거나 \\dfrac사용. (예: '$\\displaystyle\\lim_{n \\to \\infty}$', '$\\displaystyle\\int_{a}^{b}$')
        *   작은 네모 박스 안 텍스트는 '\$\\fbox{텍스트}$' 형식으로 작성합니다. (예: '\$\\fbox{  가  }$')
        * 난이도는 최하, 하, 중, 상, 최상 중 하나로 작성합니다. 해설을 보면 난이도도 알 수 있죠? 즉 당신이 수정할 수 있는 칼럼은 정답, 해설, 난이도입니다.
    *   만약 정답이나 해설 생성이 불가능하거나 원본에 없다면, '정답 없음' 또는 '해설 생성 불가' 와 같이 명확히 표시하거나 'null'에 해당하는 값을 준비합니다.
    * 코드블럭에 결과물을 작성합니다.

**예시 작업:**

*   **출력:**
   {
  "problems": [
    {
      "problem_id": "244919dc-a659-457f-8a5d-37a2aa89e5b5",
      "question_number": 1,
      "problem_type": "객관식",
      "question_text": "수열 \${a_n}$이 모든 자연수 $n$에 대하여 $a_{n+1} = 2a_n$을 만족시킨다. $a_2 = 4$일 때, $a_8$의 값은? 
      [$3.8$점]<br>\n① $16$ &emsp;② $32$ &emsp;③ $64$ &emsp;④ $128$ &emsp;⑤ $256$",
      "answer": "⑤",
      "solution_text": "주어진 점화식 $a_{n+1} = 2a_n$은 수열 \\{a_n\\}이 공비가 $2$인 등비수열임을 의미합니다. 제$2$항 $a_2 = 4$이므로 제$8$항 $a_8$은 $a_8 = a_2 \\times r^{8-2} = a_2 \\times 2^6$으로 구할 수 있습니다. 따라서 $a_8 = 4 \\times 2^6$ 
      $= 2^2 \\times 2^6 = 2^8 = 256$입니다.",
      "page": null,
      "grade": "고2",
      "semester": "1학기",
      "source": "2022학년도 계양고등학교 2학년 1학기 기말고사",
      "major_chapter_id": "수열",
      "middle_chapter_id": "등비수열",
      "core_concept_id": "등비수열의 일반항",
      "problem_category": "등비수열의 특정 항 구하기",
      "difficulty": "중",
      "score": "3.8점"
    },
    {
      "problem_id": "3c0a9006-bdfb-4d27-ab62-f6f517dc5836",
      "question_number": 2,
      "problem_type": "객관식",
      "question_text": "제$2$항이 $-6$, 제$10$항이 $26$인 등차수열의 제$6$항은? 
      [$3.8$점]<br>\n① $9$ &emsp;&emsp;② $10$ &emsp;&emsp;③ $11$ &emsp;&emsp;④ $12$ &emsp;&emsp;⑤ $13$",
      "answer": "②",
      "solution_text": "등차수열 \\{a_n\\}의 첫째항을 $a$, 공차를 $d$라 하면, 제$2$항은 $a_2 = a+d = -6$이고, 제$10$항은 $a_{10} = a+9d=26$입니다. 두 식을 연립하여 풀면, $(a+9d) - (a+d) = 26 - (-6)$에서 $8d = 32$, 즉 $d=4$입니다. $a+4=-6$이므로 $a=-10$입니다. 따라서 제$6$항은 $a_6 = a+5d = -10 + 5(4) = -10 + 20 = 10$입니다.\n\n[다른 풀이]\n등차수열에서 항의 번호가 등차수열을 이루면, 그 항들도 등차수열을 이룹니다. $2, 6, 10$은 공차가 $4$인 등차수열이므로, $a_2, a_6, a_{10}$도 등차수열을 이룹니다. 따라서 $a_6$은 $a_2$와 $a_{10}$의 등차중항입니다. $a_6 = \\dfrac{a_2 + a_{10}}{2} = \\dfrac{-6+26}{2} = \\dfrac{20}{2} = 10$입니다.",
      "page": null,
      "grade": "고2",
      "semester": "1학기",
      "source": "2022학년도 계양고등학교 2학년 1학기 기말고사",
      "major_chapter_id": "수열",
      "middle_chapter_id": "등차수열",
      "core_concept_id": "등차수열의 일반항",
      "problem_category": "등차수열의 특정 항 구하기",
      "difficulty": "중",
      "score": "3.8점"
    }
  ]
}

##작업할 파일은 아래에 있습니다. 문제 텍스트의 라텍스 규칙에 맞춰서 해설과 정답칸, 난이도칸을 채워주고 다른 칼럼의 데이터는 원본 그대로 보존해주세요.
    `
    },
    {
        id: 'default-3',
        title: '문제 개별화 작업',
        content: `**당신은 텍스트 데이터를 분석하여 아래 제공된 JSON 스키마 구조에 맞게 정리하는 데이터 구조화 전문가입니다.**

**지시사항:**

1.  **입력:**
    *   'problem_text_latex': 1단계에서 생성된 LaTeX 형식의 문제 텍스트.
    *   'answer_string': (null가능).
    *   'solution_string_latex': 데이터가 있으면 쓰고 없으면 null (또는 null).
    *   (선택) 'page', 'grade', 'source' 등 파악 가능한 추가 정보.
    *   **참조:** 아래 'edit code'로 제공되는 JSON 스키마.

2.  **작업:**
    *   **[중요] \`question_number\` 및 \`problem_type\` 처리:**
        *   원본 문제 번호가 "서답형 1"과 같이 텍스트와 숫자가 섞여 있으면, **JSON의 \`question_number\`에는 숫자 \`1\`만, \`problem_type\`에는 "서답형"을 입력**합니다.
        *   원본 문제 번호가 그냥 숫자 "5.1"이면, \`question_number\`에 \`5.1\`을 입력하고, 문제에 선택지가 있으면 \`problem_type\`을 "객관식", 없으면 "서답형"으로 설정합니다.
    *   **[중요] \`question_text\` 필드 처리:**
        *   **\`question_text\` 필드에는 문제의 질문 본문과 객관식 선택지를 모두 포함**시켜야 합니다.
    *   **[중요] Null 값 처리:**
        *   만약 정답이나 해설이 없다면, \`answer\`와 \`solution_text\` 필드 값은 반드시 **null**로 설정해주세요. (빈 문자열 ""이 아님)
    *   **[중요] 문제와 보기 사이에는 "\\n <br> \\n"을 넣어서 빈 줄을 만듭니다. <br> 다음에 \\n을 넣어야 줄바꿈이 제대로 입력됩니다.
    *   **보기와 보기 사이에는 "&emsp;"를 한 번 또는 두 번 써서 적당히 여백을 만듭니다.
    *   ** score를 필드에 입력했으면 문제 텍스트의 점수부분은 제거합니다.(문제 텍스트는 무결성이 중요하니까 다른 부분은 건드리지 않습니다.)
    *   **메타데이터 추론:** \`major_chapter_id\`, \`middle_chapter_id\`, \`core_concept_id\`, \`problem_category\` 필드는 문제 내용과 해설을 분석하여 가장 관련성 높은 **단일 문자열 값**을 추론하여 채웁니다. (예: "미적분", "이차함수")

3.  **출력:** 아래 'edit code'의 JSON 스키마 **구조**를 준수하는 JSON 객체 문자열.

**예시 (스키마 반영):**
\`\`\`json
{
  "problems": [
    {
      "question_number": 1,
      "problem_type": "객관식",
      "question_text": "수열 \${a_n}$이 모든 자연수 $n$에 대하여 $a_{n+1} = 2a_n$을 만족시킨다. $a_2 = 4$일 때, $a_8$의 값은? \\\\n <br> \\\\n① $16$ &emsp;&emsp;② $32$ &emsp;&emsp;③ $64$ &emsp;&emsp;④ $128$ &emsp;&emsp;⑤ $256$",
      "answer": null,
      "solution_text": null,
      "page": null,
      "grade": null,
      "semester": null,
      "source": null,
      "major_chapter_id": "수열",
      "middle_chapter_id": "등비수열",
      "core_concept_id": "등비수열의 일반항",
      "problem_category": "등비수열의 특정 항 구하기",
      "difficulty": null,
      "score": "3.8점"
    },
    {
      "question_number": 8,
      "problem_type": "객관식",
      "question_text": "다음은 $n \\\\ge 5$인 모든 자연수 $n$에 대하여 부등식 $2^n > n^2 \\\\cdots (\\\\star)$이 성립함을 수학적 귀납법으로 증명한 것이다.\\\\n\\\\begin{tabular}{|l|}\\\\hline\\\\n(i) $n=$ $\\\\fbox{  A  }$ 이면 (좌변)= $\\\\fbox{ B }$  >  $\\\\fbox{ C }$ $=$(우변)이므로 $(\\\\star)$이 성립한다.<br><br>\\\\n (ii) $n=k(k \\\\ge 5)$일 때 $(\\\\star)$는 성립한다고 가정하면 $2^k > k^2$이다.\\\\n 양변에 $\\\\fbox{ D }$ 를 곱하면 $2^{k+1} >  \\\\fbox{ D } k^2$이다.\\\\n<br>이때, $f(k) =  \\\\fbox{ D } k^2 - (k+1)^2$이라 하면 $f(k)$의 최솟값은 $\\\\fbox{ E }$ 이므로 $f(k) > 0$이다.\\\\n즉, $2^{k+1} > (k+1)^2$이다.\\\\n따라서 $n=k+1$일 때도 $(\\\\star)$는 성립한다.<br><br>\\\\n (i), (ii)에 의하여 $n \\\\ge 5$인 모든 자연수 $n$에 대하여 $(\\\\star)$은 성립한다.\\\\\\\\n \\\\hline\\\\n\\\\end{tabular}\\\\n\\\\n위의 $A, B, C, D, E$ 에 알맞은 수를 각각 $a, b, c, d, e$라 할 때, $a+b+c+d+e$의 값은? \\\\n <br> \\\\n① $64$ &emsp;② $71$ &emsp;③ $78$ &emsp;④ $82$ &emsp;⑤ $86$",
      "answer": null,
      "solution_text": null,
      "page": null,
      "grade": null,
      "semester": null,
      "source": null,
      "major_chapter_id": "수학적 귀납법",
      "middle_chapter_id": "부등식의 증명",
      "core_concept_id": "수학적 귀납법을 이용한 부등식 증명",
      "problem_category": "수학적 귀납법 빈칸 채우기",
      "difficulty": null,
      "score": "4.6점"
    }
  ]
}
\`\`\`
    
  ##실제 작업할 문제는 아래에\`
    `
    }
];

const STORAGE_KEY = 'promptCollection';

export function usePromptManager() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingContent, setEditingContent] = useState('');
    const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);

    useEffect(() => {
        let initialPrompts: Prompt[] = [];
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                initialPrompts = JSON.parse(storedData);
                defaultPrompts.forEach(defaultPrompt => {
                    if (!initialPrompts.some((p: Prompt) => p.id === defaultPrompt.id)) {
                        initialPrompts.unshift(defaultPrompt);
                    }
                });
            } else {
                initialPrompts = [...defaultPrompts];
            }
        } catch (error) {
            console.error("Failed to load prompts from localStorage", error);
            initialPrompts = [...defaultPrompts];
        }
        
        setPrompts(initialPrompts);
        setExpandedPromptId(null);
    }, []);

    useEffect(() => {
        if (prompts.length > 0) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
            } catch (error) {
                console.error("Failed to save prompts to localStorage", error);
            }
        } else {
             localStorage.removeItem(STORAGE_KEY);
        }
    }, [prompts]);

    const addPrompt = useCallback(() => {
        const newPrompt: Prompt = {
            id: `prompt-${Date.now()}`,
            title: '새 프롬프트',
            content: '여기에 프롬프트 내용을 작성하세요.'
        };
        const nextPrompts = produce(prompts, draft => {
            draft.push(newPrompt);
        });
        setPrompts(nextPrompts);
        setEditingPromptId(newPrompt.id);
        setEditingTitle(newPrompt.title);
        setEditingContent(newPrompt.content);
        setExpandedPromptId(newPrompt.id);
    }, [prompts]);

    const deletePrompt = useCallback((idToDelete: string) => {
        if (idToDelete.startsWith('default-')) {
            alert('기본 프롬프트는 삭제할 수 없습니다.');
            return;
        }
        if (window.confirm("정말로 이 프롬프트를 삭제하시겠습니까?")) {
            setPrompts(prev => prev.filter(p => p.id !== idToDelete));
        }
    }, []);
    
    const resetDefaultPrompt = useCallback((idToReset: string) => {
        const originalPrompt = defaultPrompts.find(p => p.id === idToReset);
        if (!originalPrompt || !window.confirm('이 프롬프트를 기본값으로 되돌리시겠습니까? 변경사항은 사라집니다.')) {
            return;
        }
        
        const nextPrompts = produce(prompts, draft => {
            const promptToReset = draft.find(p => p.id === idToReset);
            if (promptToReset) {
                promptToReset.title = originalPrompt.title;
                promptToReset.content = originalPrompt.content;
            }
        });
        setPrompts(nextPrompts);
    }, [prompts]);
    
    const startEditing = useCallback((prompt: Prompt) => {
        setEditingPromptId(prompt.id);
        setEditingTitle(prompt.title);
        setEditingContent(prompt.content);
        setExpandedPromptId(prompt.id);
    }, []);

    const cancelEditing = useCallback(() => {
        setEditingPromptId(null);
        setEditingTitle('');
        setEditingContent('');
    }, []);

    const saveEditing = useCallback(() => {
        if (!editingPromptId) return;
        
        const nextPrompts = produce(prompts, draft => {
            const promptToUpdate = draft.find(p => p.id === editingPromptId);
            if (promptToUpdate) {
                promptToUpdate.title = editingTitle.trim() || '제목 없음';
                promptToUpdate.content = editingContent;
            }
        });
        setPrompts(nextPrompts);
        cancelEditing();
    }, [editingPromptId, editingTitle, editingContent, prompts, cancelEditing]);

    const toggleExpand = useCallback((id: string) => {
        if (editingPromptId && editingPromptId !== id) return;
        setExpandedPromptId(prevId => (prevId === id ? null : id));
    }, [editingPromptId]);

    return {
        prompts,
        editingPromptId,
        editingTitle,
        setEditingTitle,
        editingContent,
        setEditingContent,
        expandedPromptId,
        toggleExpand,
        addPrompt,
        deletePrompt,
        resetDefaultPrompt,
        startEditing,
        cancelEditing,
        saveEditing,
    };
}