// API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 在文件开头添加
let isApiKeyVerified = false;

// 验证API密钥
async function verifyApiKey(apiKey) {
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "验证API密钥"
                    },
                    {
                        role: "user",
                        content: "你好"
                    }
                ],
                max_tokens: 10
            })
        });

        if (!response.ok) {
            throw new Error('API密钥无效');
        }

        return true;
    } catch (error) {
        console.error('API密钥验证失败:', error);
        return false;
    }
}

// 工具函数：调用Deepseek API
async function callDeepseekAPI(messages, temperature = 0.7, maxTokens = 2000) {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        throw new Error('请输入API密钥！');
    }

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages,
            temperature,
            max_tokens: maxTokens,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.3
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '请求失败');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// API调用函数
async function generatePlot(title, theme) {
    const prompt = `
作为一个专业的小说策划师，请为这部小说创作一个引人入胜的主要剧情：

小说标题：${title}
类型：${theme}

要求：
1. 构思完整的故事主线，包含开端、发展、高潮和结局
2. 设计合理的情节转折点
3. 故事要有吸引力和创新性
4. 符合${theme}类型小说的特点
5. 篇幅在500字左右

请直接输出剧情内容，不需要其他额外说明。`;

    return await callDeepseekAPI([
        {
            role: "system",
            content: "你是一个专业的小说策划师，擅长设计引人入胜的故事情节。"
        },
        {
            role: "user",
            content: prompt
        }
    ], 0.8, 1000);
}

async function generateCharacters(title, theme, plot) {
    const prompt = `
作为一个专业的小说角色设计师，请为这部小说创建主要人物设定：

小说标题：${title}
类型：${theme}
主要剧情：${plot}

要求：
1. 设计3-5个主要角色
2. 包含每个角色的性格特点、背景故事、外貌特征
3. 人物性格要丰富立体，避免脸谱化
4. 角色之间要有合理的关系和互动
5. 人物设定要符合故事背景和主题
6. 每个角色的设定200字左右

请直接输出人物设定，不需要其他额外说明。`;

    return await callDeepseekAPI([
        {
            role: "system",
            content: "你是一个专业的小说角色设计师，擅长创造丰富立体的人物形象。"
        },
        {
            role: "user",
            content: prompt
        }
    ], 0.8, 1500);
}

async function generateWorld(title, theme, plot) {
    const prompt = `
作为一个专业的小说世界观设计师，请为这部小说创建完整的世界观设定：

小说标题：${title}
类型：${theme}
主要剧情：${plot}

要求：
1. 详细描述故事发生的时代背景和环境
2. 设计独特的世界规则和运行机制
3. 包含社会制度、文化习俗等内容
4. 如有必要，可以包含特殊的力量体系或科技水平
5. 世界观要符合故事主题和类型特点
6. 设定要合理且具有内在逻辑性
7. 篇幅在500字左右

请直接输出世界观设定，不需要其他额外说明。`;

    return await callDeepseekAPI([
        {
            role: "system",
            content: "你是一个专业的小说世界观设计师，擅长创造独特而合理的故事背景。"
        },
        {
            role: "user",
            content: prompt
        }
    ], 0.8, 1000);
}

async function optimizeContent(content, type) {
    const prompt = `
作为一个专业的小说内容优化专家，请优化以下${type}：

原始内容：
${content}

优化要求：
1. 保持原有内容的核心思想
2. 改善文字表达，使其更加生动形象
3. 增加细节描写，丰富内容
4. 确保逻辑性和连贯性
5. 修正可能存在的问题或漏洞
6. ${type === '剧情' ? '优化情���发展和转折' : 
     type === '人物设定' ? '使人物形象更加丰满立体' : 
     '完善世界观的合理性和独特性'}

请直接输出优化后的内容，不需要其他额外说明。`;

    return await callDeepseekAPI([
        {
            role: "system",
            content: "你是一个专业的小说内容优化专家，擅长改进和完善文学创作内容。"
        },
        {
            role: "user",
            content: prompt
        }
    ], 0.7, 2000);
}

async function generateChapter(params) {
    const {
        title,
        theme,
        writingStyle,
        mainPlot,
        characterInfo,
        worldSetting,
        chapterLength,
        creativity,
        currentChapter,
        totalChapters,
        chapterOutline,
        previousSummary
    } = params;

    let chapterType = '';
    if (currentChapter === 1) {
        chapterType = '开篇';
    } else if (currentChapter === totalChapters) {
        chapterType = '结局';
    } else if (currentChapter === Math.ceil(totalChapters * 0.7)) {
        chapterType = '高潮';
    } else {
        chapterType = '情节';
    }

    const prompt = `
作为一个专业的小说创作者，请根据以下信息创作一个精彩的章节：

小说标题：${title}
类型：${theme}
写作风格��${writingStyle}
当前章节：第${currentChapter}章（共${totalChapters}章）
章节类型：${chapterType}章节

世界观设定：
${worldSetting}

主要人物设定：
${characterInfo}

整体剧情概要：
${mainPlot}

本章大纲：
${chapterOutline}

${previousSummary ? `前文概要：\n${previousSummary}\n` : ''}

写作要求：
1. 这是第${currentChapter}章，共${totalChapters}章，请把握好情节推进的节奏
2. 这是一个${chapterType}章节，要符合${chapterType}章节的特点
3. 字数控制在${chapterLength}字左右
4. 使用${writingStyle}的写作风格
5. 注意人物性格的一致性和发展
6. 场景描写要细腻，对话要生动
7. 符合${theme}类型小说的特点
8. 注意与前后章节的连贯性
9. 严格按照本章大纲展开情节

${currentChapter === 1 ? '作为开篇章节，需要吸引读者注意力，并做好人物和背景的铺垫。' : ''}
${currentChapter === totalChapters ? '作为结局章节，需要完美收束所有情节，给读者一个满意的结局。' : ''}
${chapterType === '高潮' ? '作为高潮章节，需要制造足够的戏剧冲突和情节张力。' : ''}

请直接开始创作小说内容，不需要其他额外说明。`;

    return await callDeepseekAPI([
        {
            role: "system",
            content: `你是一个专业的小说创作者，擅长${theme}类型的小说创作。你需要创作出符合要求的小��章节，注意与整体故事的连贯性。`
        },
        {
            role: "user",
            content: prompt
        }
    ], creativity / 100, Math.min(chapterLength * 2, 4000));
}

// 生成章节大纲
async function generateChapterOutlines(title, theme, mainPlot, characterInfo, worldSetting, totalChapters, updateProgress) {
    // 生成整体大纲
    const overallPrompt = `
作为一个专业的小说策划师，请为这部小说制定整体大纲规划：

小说标题：${title}
类型：${theme}
总章节数：${totalChapters}章

主要剧情：
${mainPlot}

主要人物设定：
${characterInfo}

世界观设定：
${worldSetting}

要求：
1. 规划整体故事节奏和走向
2. 确定重要转折点和高潮位置
3. 合理分配情节发展
4. 注意故事的完整性和连贯性

请直接输出规划内容，不需要其他额外说明。`;

    try {
        updateProgress('正在规划整体故事结构...', 10);
        const overallPlan = await callDeepseekAPI([
            {
                role: "system",
                content: "你是一个专业的小说策划师，擅长设计故事结构和情节规划。"
            },
            {
                role: "user",
                content: overallPrompt
            }
        ], 0.7, 2000);

        // 分批生成各章节大纲
        const batchSize = 5; // 每批生成5章
        const batches = Math.ceil(totalChapters / batchSize);
        const outlines = new Array(totalChapters);
        
        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
            const startChapter = batchIndex * batchSize + 1;
            const endChapter = Math.min(startChapter + batchSize - 1, totalChapters);
            
            updateProgress(`正在生成第 ${startChapter} - ${endChapter} 章大纲...`, 10 + (batchIndex + 1) * (90 / batches));

            const batchPrompt = `
基于以下整体规划，为第${startChapter}章到第${endChapter}章生成详细大纲：

整体规划：
${overallPlan}

要求：
1. 为每一章生成具体的大纲
2. 每章大纲需要包含该章节的主要事件和情节发展
3. 注意与整体规划的一致性
4. 确保章节之间的连贯性
5. 每章大纲100字左右

请按以下格式输出：
第${startChapter}章：[具体大纲内容]
第${startChapter + 1}章：[具体大纲内容]
...以此类推`;

            const batchContent = await callDeepseekAPI([
                {
                    role: "system",
                    content: "你是一个专业的小说策划师，擅长设计章节大纲和情节架构。"
                },
                {
                    role: "user",
                    content: batchPrompt
                }
            ], 0.8, 2000);

            // 解析本批次的大纲内容
            const outlineRegex = /第(\d+)章[：:]([\s\S]+?)(?=第\d+章|$)/g;
            let match;
            while ((match = outlineRegex.exec(batchContent)) !== null) {
                const chapterNum = parseInt(match[1]);
                const outlineContent = match[2].trim();
                outlines[chapterNum - 1] = outlineContent;
            }

            // 等待一小段时间，避免API调用过于频繁
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        updateProgress('正在完成大纲生成...', 100);

        // 确保每章都有大纲
        for (let i = 0; i < totalChapters; i++) {
            if (!outlines[i]) {
                outlines[i] = `第${i + 1}章的故事大纲（待生成）`;
            }
        }

        return outlines;
    } catch (error) {
        console.error('生成大纲失败:', error);
        throw error;
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const generateOutlinesBtn = document.getElementById('generateOutlinesBtn');
    const novelTitle = document.getElementById('novelTitle');
    const novelTheme = document.getElementById('novelTheme');
    const writingStyle = document.getElementById('writingStyle');
    const totalChapters = document.getElementById('totalChapters');
    const mainPlot = document.getElementById('mainPlot');
    const characterInfo = document.getElementById('characterInfo');
    const worldSetting = document.getElementById('worldSetting');
    const chapterLength = document.getElementById('chapterLength');
    const creativity = document.getElementById('creativity');
    const creativityValue = document.getElementById('creativityValue');
    const chapterOutlinesList = document.getElementById('chapterOutlinesList');
    const chapterList = document.getElementById('chapterList');
    const loading = document.querySelector('.loading');
    const progress = document.querySelector('.progress');
    const currentProgress = document.getElementById('currentProgress');
    const totalInfo = document.getElementById('totalInfo');
    const generatePlotBtn = document.getElementById('generatePlotBtn');
    const optimizePlotBtn = document.getElementById('optimizePlotBtn');
    const generateCharactersBtn = document.getElementById('generateCharactersBtn');
    const optimizeCharactersBtn = document.getElementById('optimizeCharactersBtn');
    const generateWorldBtn = document.getElementById('generateWorldBtn');
    const optimizeWorldBtn = document.getElementById('optimizeWorldBtn');

    let novelContent = [];
    let chapterOutlines = [];
    let generationStatus = new Map();
    
    // 更新创意度显示
    creativity.addEventListener('input', (e) => {
        creativityValue.textContent = e.target.value;
    });

    // 监听章节数变化，更新大纲输入框
    totalChapters.addEventListener('change', () => {
        updateOutlineInputs();
    });

    // 自动生成大纲按钮点击事件
    generateOutlinesBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!validateBasicInputs()) return;

        try {
            // 显示加载状态
            loading.style.display = 'block';
            setButtonLoading(generateOutlinesBtn, true);

            // 更新进度的函数
            const updateProgress = (message, percentage) => {
                currentProgress.textContent = message;
                progress.style.width = `${percentage}%`;
            };

            const outlines = await generateChapterOutlines(
                novelTitle.value,
                novelTheme.value,
                mainPlot.value,
                characterInfo.value,
                worldSetting.value,
                parseInt(totalChapters.value),
                updateProgress
            );

            // 确保大纲列表已经创建
            if (chapterOutlinesList.children.length === 0) {
                updateOutlineInputs();
            }

            // 更新大纲输入框
            outlines.forEach((outline, index) => {
                const textarea = document.querySelector(`textarea[data-chapter="${index + 1}"]`);
                if (textarea) {
                    textarea.value = outline;
                }
            });

            // 完成提示
            updateProgress('大纲生成完成！', 100);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 滚动到大纲区域
            chapterOutlinesList.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('生成大纲时出错:', error);
            alert('生成大纲时发生错误：' + error.message);
        } finally {
            loading.style.display = 'none';
            setButtonLoading(generateOutlinesBtn, false);
        }
    });

    // API密钥相关元素
    const apiKeyInput = document.getElementById('apiKey');
    const verifyKeyBtn = document.getElementById('verifyKeyBtn');
    const apiKeyStatus = document.getElementById('apiKeyStatus');
    const toggleApiKey = document.getElementById('toggleApiKey');

    // API密钥显示切换
    toggleApiKey.addEventListener('click', () => {
        const type = apiKeyInput.type;
        apiKeyInput.type = type === 'password' ? 'text' : 'password';
        toggleApiKey.innerHTML = `<i class="fas fa-eye${type === 'password' ? '' : '-slash'}"></i>`;
    });

    // 生成剧情按钮点击事件
    generatePlotBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!novelTitle.value || !novelTheme.value) {
            alert('请先填写小说标题和类型！');
            return;
        }

        try {
            setButtonLoading(generatePlotBtn, true);
            const content = await generatePlot(novelTitle.value, novelTheme.value);
            mainPlot.value = content;
        } catch (error) {
            alert('生成剧情时发生错误：' + error.message);
        } finally {
            setButtonLoading(generatePlotBtn, false);
        }
    });

    // 生成人物设定按钮点击事件
    generateCharactersBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!validateBasicPlot()) return;

        try {
            setButtonLoading(generateCharactersBtn, true);
            const content = await generateCharacters(
                novelTitle.value,
                novelTheme.value,
                mainPlot.value
            );
            characterInfo.value = content;
        } catch (error) {
            alert('生成人物设定时发生错误：' + error.message);
        } finally {
            setButtonLoading(generateCharactersBtn, false);
        }
    });

    // 生成世界观设定按钮点击事件
    generateWorldBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!validateBasicPlot()) return;

        try {
            setButtonLoading(generateWorldBtn, true);
            const content = await generateWorld(
                novelTitle.value,
                novelTheme.value,
                mainPlot.value
            );
            worldSetting.value = content;
        } catch (error) {
            alert('生成世界观设定时发生错误：' + error.message);
        } finally {
            setButtonLoading(generateWorldBtn, false);
        }
    });

    // 优化剧情按钮点击事件
    optimizePlotBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!mainPlot.value.trim()) {
            alert('请先填写或生成主要剧情！');
            return;
        }

        try {
            setButtonLoading(optimizePlotBtn, true);
            const content = await optimizeContent(mainPlot.value, '剧情');
            mainPlot.value = content;
        } catch (error) {
            alert('优化剧情时发生错误：' + error.message);
        } finally {
            setButtonLoading(optimizePlotBtn, false);
        }
    });

    // 优化人物设定按钮点击事件
    optimizeCharactersBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!characterInfo.value.trim()) {
            alert('请先填写或生成人物设定！');
            return;
        }

        try {
            setButtonLoading(optimizeCharactersBtn, true);
            const content = await optimizeContent(characterInfo.value, '人物设定');
            characterInfo.value = content;
        } catch (error) {
            alert('优化人物设定时发生错误：' + error.message);
        } finally {
            setButtonLoading(optimizeCharactersBtn, false);
        }
    });

    // 优化世界观设定按钮点击事件
    optimizeWorldBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!worldSetting.value.trim()) {
            alert('请先填写或生成世界观设定！');
            return;
        }

        try {
            setButtonLoading(optimizeWorldBtn, true);
            const content = await optimizeContent(worldSetting.value, '世界观设定');
            worldSetting.value = content;
        } catch (error) {
            alert('优化世界观设定时发生错误：' + error.message);
        } finally {
            setButtonLoading(optimizeWorldBtn, false);
        }
    });

    // 生成小说按钮点击事件
    generateBtn.addEventListener('click', async () => {
        if (!validateApiKey()) return;
        if (!validateAllInputs()) return;

        try {
            loading.style.display = 'block';
            generateBtn.disabled = true;
            chapterList.innerHTML = '';
            novelContent = [];
            let totalWords = 0;

            const chapters = parseInt(totalChapters.value);
            await generateChaptersInBatches(chapters);

            saveBtn.disabled = false;
            totalInfo.textContent = `总字数：${calculateTotalWords()}`;
        } catch (error) {
            alert('生成小说时发生错误：' + error.message);
        } finally {
            loading.style.display = 'none';
            generateBtn.disabled = false;
        }
    });

    // 保存按钮点击事件
    saveBtn.addEventListener('click', () => {
        const fullContent = formatNovelForSaving();
        downloadNovel(fullContent);
    });

    // 工具函数
    function updateOutlineInputs() {
        const count = parseInt(totalChapters.value);
        chapterOutlinesList.innerHTML = '';
        chapterOutlines = [];

        for (let i = 1; i <= count; i++) {
            const outlineItem = createOutlineInput(i);
            chapterOutlinesList.appendChild(outlineItem);
        }
    }

    function createOutlineInput(chapterNum) {
        const div = document.createElement('div');
        div.className = 'chapter-outline-item';
        
        const header = document.createElement('div');
        header.className = 'chapter-outline-header';
        
        const title = document.createElement('div');
        title.className = 'chapter-outline-title';
        title.textContent = `第${chapterNum}章大纲`;
        
        const textarea = document.createElement('textarea');
        textarea.className = 'chapter-outline-textarea';
        textarea.placeholder = '请输入本章节的具体情节安排';
        textarea.dataset.chapter = chapterNum;
        
        header.appendChild(title);
        div.appendChild(header);
        div.appendChild(textarea);
        
        return div;
    }

    async function generateChaptersInBatches(totalChapters) {
        const batchSize = 3;
        const batches = Math.ceil(totalChapters / batchSize);
        let completedChapters = 0;

        for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
            const start = batchIndex * batchSize + 1;
            const end = Math.min(start + batchSize - 1, totalChapters);
            const batchPromises = [];

            for (let chapter = start; chapter <= end; chapter++) {
                batchPromises.push(generateChapterWithRetry(chapter, totalChapters));
            }

            const batchResults = await Promise.all(batchPromises);
            
            batchResults.forEach((result, index) => {
                if (result) {
                    const chapterNum = start + index;
                    novelContent[chapterNum - 1] = {
                        chapter: chapterNum,
                        content: result.content
                    };
                    displayChapter(chapterNum, result.content);
                    completedChapters++;
                }
            });

            updateProgress((completedChapters / totalChapters) * 100);
            currentProgress.textContent = `正在生成第 ${completedChapters} 章，共 ${totalChapters} 章`;
        }
    }

    async function generateChapterWithRetry(chapterNum, totalChapters, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const params = {
                    title: novelTitle.value,
                    theme: novelTheme.value,
                    writingStyle: writingStyle.value,
                    mainPlot: mainPlot.value,
                    characterInfo: characterInfo.value,
                    worldSetting: worldSetting.value,
                    chapterLength: parseInt(chapterLength.value),
                    creativity: parseInt(creativity.value),
                    currentChapter: chapterNum,
                    totalChapters: totalChapters,
                    chapterOutline: getChapterOutline(chapterNum),
                    previousSummary: getPreviousChaptersSummary(chapterNum)
                };

                const content = await generateChapter(params);

                if (!validateGeneratedContent(content)) {
                    throw new Error('内容验证失败');
                }

                return { content };
            } catch (error) {
                console.error(`Chapter ${chapterNum} generation attempt ${attempt} failed:`, error);
                if (attempt === maxRetries) {
                    throw new Error(`第${chapterNum}章生成失败，已重试${maxRetries}次`);
                }
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    function validateGeneratedContent(content) {
        // 内容验证逻辑
        return content && content.length >= 100;
    }

    function getChapterOutline(chapterNum) {
        const textarea = document.querySelector(`textarea[data-chapter="${chapterNum}"]`);
        return textarea ? textarea.value : '';
    }

    function getPreviousChaptersSummary(currentChapter) {
        if (currentChapter === 1) return '';
        
        return novelContent
            .slice(0, currentChapter - 1)
            .map((chapter, index) => `第${index + 1}章：${summarizeContent(chapter.content)}`)
            .join('\n\n');
    }

    function summarizeContent(content) {
        // 简单的内容摘要逻辑
        return content.slice(0, 200) + '...';
    }

    function validateBasicInputs() {
        if (!novelTitle.value) {
            alert('请输入小说标题！');
            return false;
        }
        if (!mainPlot.value) {
            alert('请输入主要剧情！');
            return false;
        }
        if (!characterInfo.value) {
            alert('请输入人物设定！');
            return false;
        }
        if (!worldSetting.value) {
            alert('请输入世界观设定！');
            return false;
        }
        return true;
    }

    function validateAllInputs() {
        if (!validateBasicInputs()) return false;
        
        const chapterCount = parseInt(totalChapters.value);
        if (!chapterCount || chapterCount < 1 || chapterCount > 50) {
            alert('章节数必须在1-50章之间！');
            return false;
        }
        
        const outlines = Array.from(document.querySelectorAll('.chapter-outline-textarea'));
        const emptyOutlines = outlines.filter(outline => !outline.value.trim());
        
        if (emptyOutlines.length > 0) {
            alert('请填写所有章节的大纲！');
            return false;
        }
        
        return true;
    }

    function displayChapter(chapterNum, content) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter';
        
        const chapterHeader = document.createElement('div');
        chapterHeader.className = 'chapter-header';
        
        const chapterTitle = document.createElement('div');
        chapterTitle.className = 'chapter-title';
        chapterTitle.textContent = `第${chapterNum}章`;
        
        const wordCount = document.createElement('div');
        wordCount.className = 'chapter-word-count';
        wordCount.textContent = `字数：${content.length}`;
        
        chapterHeader.appendChild(chapterTitle);
        chapterHeader.appendChild(wordCount);
        
        const chapterContent = document.createElement('div');
        chapterContent.className = 'chapter-content';
        chapterContent.innerHTML = formatContent(content);
        
        chapterDiv.appendChild(chapterHeader);
        chapterDiv.appendChild(chapterContent);
        chapterList.appendChild(chapterDiv);
    }

    function formatContent(content) {
        return content
            .split('\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph)
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('');
    }

    function formatNovelForSaving() {
        return novelContent
            .map(chapter => `第${chapter.chapter}章\n\n${chapter.content}\n\n`)
            .join('\n');
    }

    function downloadNovel(content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${novelTitle.value}_完整版.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function calculateTotalWords() {
        return novelContent.reduce((total, chapter) => total + chapter.content.length, 0);
    }

    function updateProgress(percentage) {
        progress.style.width = `${percentage}%`;
    }

    // 工具函数
    function setButtonLoading(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    function validateBasicPlot() {
        if (!novelTitle.value || !novelTheme.value) {
            alert('请先填写小说标题和类型！');
            return false;
        }
        if (!mainPlot.value.trim()) {
            alert('请先填写或生成主要剧情！');
            return false;
        }
        return true;
    }

    // 修改validateApiKey函数
    function validateApiKey() {
        if (!isApiKeyVerified) {
            alert('请先验证API密钥！');
            return false;
        }
        return true;
    }

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'content-overlay';
    overlay.innerHTML = '<div class="content-overlay-message">请先验证API密钥</div>';
    document.body.appendChild(overlay);

    // 获取主内容区域
    const mainContent = document.querySelector('main');
    mainContent.classList.add('main-content');

    // API密钥验证成功后的处理
    function handleApiKeySuccess() {
        isApiKeyVerified = true;
        apiKeyStatus.textContent = '验证成功！';
        apiKeyStatus.className = 'api-key-status success';
        apiKeyInput.disabled = true;
        verifyKeyBtn.style.display = 'none';
        
        // 移除遮罩层效果，激活主内容区域
        overlay.style.background = 'transparent';
        overlay.style.backdropFilter = 'none';
        mainContent.classList.add('active');
        
        // 保存API密钥到localStorage
        localStorage.setItem('deepseek_api_key', apiKeyInput.value);
    }

    // API密钥验证失败后的处理
    function handleApiKeyError() {
        isApiKeyVerified = false;
        apiKeyStatus.textContent = 'API密钥无效！';
        apiKeyStatus.className = 'api-key-status error';
        apiKeyInput.value = '';
        
        // 显示遮罩层，禁用主内容区域
        overlay.style.background = 'rgba(0, 0, 0, 0.8)';
        overlay.style.backdropFilter = 'blur(5px)';
        mainContent.classList.remove('active');
    }

    // API密钥验证按钮点击事件
    verifyKeyBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('请输入API密钥！');
            return;
        }

        try {
            verifyKeyBtn.disabled = true;
            verifyKeyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证中...';
            apiKeyStatus.textContent = '正在验证...';
            apiKeyStatus.className = 'api-key-status verifying';

            const isValid = await verifyApiKey(apiKey);

            if (isValid) {
                handleApiKeySuccess();
            } else {
                throw new Error('API密钥无效');
            }
        } catch (error) {
            handleApiKeyError();
        } finally {
            verifyKeyBtn.disabled = false;
            verifyKeyBtn.innerHTML = '<i class="fas fa-check"></i> 验证密钥';
        }
    });

    // 检查localStorage中是否有保存的API密钥
    const savedApiKey = localStorage.getItem('deepseek_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        verifyKeyBtn.click(); // 自动验证保存的密钥
    }

    // 初始化
    updateOutlineInputs();

    // 章节数输入控制
    const numberUp = document.querySelector('.number-up');
    const numberDown = document.querySelector('.number-down');
    const quickSelectButtons = document.querySelectorAll('.quick-select button');

    // 快速选择按钮点击事件
    quickSelectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = parseInt(button.dataset.value);
            totalChapters.value = value;
            totalChapters.dispatchEvent(new Event('change'));
            
            // 更新按钮状态
            quickSelectButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // 手动输入时更新按钮状态
    totalChapters.addEventListener('input', () => {
        let value = parseInt(totalChapters.value) || 0;
        if (value < 1) {
            totalChapters.value = 1;
        } else if (value > 200) {
            totalChapters.value = 200;
        }
        
        // 更新快速选择按钮状态
        quickSelectButtons.forEach(btn => {
            if (parseInt(btn.dataset.value) === parseInt(totalChapters.value)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    });

    numberUp.addEventListener('click', () => {
        const currentValue = parseInt(totalChapters.value) || 0;
        if (currentValue < 200) {
            totalChapters.value = currentValue + 1;
            totalChapters.dispatchEvent(new Event('change'));
        }
    });

    numberDown.addEventListener('click', () => {
        const currentValue = parseInt(totalChapters.value) || 0;
        if (currentValue > 1) {
            totalChapters.value = currentValue - 1;
            totalChapters.dispatchEvent(new Event('change'));
        }
    });
}); 