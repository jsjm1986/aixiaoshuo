const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 生成大纲的API端点
app.post('/api/generate-outlines', async (req, res) => {
    try {
        const { 
            title, 
            theme, 
            mainPlot,
            characterInfo,
            worldSetting,
            totalChapters
        } = req.body;

        const prompt = `
作为一个专业的小说策划师，请根据以下信息为小说制定详细的章节大纲：

小说标题：${title}
类型：${theme}
总章节数：${totalChapters}章

世界观设定：
${worldSetting}

主要人物设定：
${characterInfo}

整体剧情概要：
${mainPlot}

要求：
1. 请为每一章设计具体的情节发展
2. 确保情节递进合理，符合故事发展规律
3. 在合适的位置设置情节高潮
4. 注意人物刻画的连贯性
5. 为每一章提供200字左右的���体内容规划

请按照以下格式输出每章大纲：
第1章：[具体情节安排]
第2章：[具体情节安排]
...以此类推

请直接开始输出大纲内容，不需要其他额外说明。`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的小说策划师，擅长制定详细的章节大纲。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        const outlines = parseOutlines(data.choices[0].message.content, totalChapters);
        res.json({ outlines });
    } catch (error) {
        console.error('生成大纲时出错:', error);
        res.status(500).json({ error: '生成大纲时发生错误' });
    }
});

// 生成小说的API端点
app.post('/api/generate', async (req, res) => {
    try {
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
        } = req.body;

        const temperature = creativity / 100;

        // 根据当前章节在整体中的位置确定章节类型
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
写作风格：${writingStyle}
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

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: `你是一个专业的小说创作者，擅长${theme}类型的小说创作。你需要创作出符合要求的小说章节，注意与整体故事的连贯性。`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: temperature,
                max_tokens: Math.min(chapterLength * 2, 4000),
                top_p: 0.9,
                frequency_penalty: 0.3,
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error('API请求失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 内容验证
        const validationResult = validateContent(content, chapterLength);
        if (!validationResult.isValid) {
            throw new Error(validationResult.error);
        }

        res.json({ content });
    } catch (error) {
        console.error('生成小说时出错:', error);
        res.status(500).json({ error: '生成小说时发生错误' });
    }
});

// 生成主要剧情
app.post('/api/generate-plot', async (req, res) => {
    try {
        const { title, theme } = req.body;

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

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的小说策划师，擅长设计引人入胜的故事情节。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('生成剧情时出错:', error);
        res.status(500).json({ error: '生成剧情时发生错误' });
    }
});

// 生成人物设定
app.post('/api/generate-characters', async (req, res) => {
    try {
        const { title, theme, plot } = req.body;

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

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的小说角色设计师，擅长创造丰富立体的人物形象。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1500
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('生成人物设定时出错:', error);
        res.status(500).json({ error: '生成人物设定时发生错误' });
    }
});

// 生成世界观设定
app.post('/api/generate-world', async (req, res) => {
    try {
        const { title, theme, plot } = req.body;

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

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的小说世界观设计师，擅长创造独特而合理的故事背景。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('生成世界观设定时出错:', error);
        res.status(500).json({ error: '生成世界观设定时发生错误' });
    }
});

// 优化文本内容
app.post('/api/optimize-content', async (req, res) => {
    try {
        const { content, type } = req.body;

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
6. ${type === '剧情' ? '优化情节发展和转折' : 
     type === '人物设定' ? '使人物形象更加丰满立体' : 
     '完善世界观的合理性和独特性'}

请直接输出优化后的内容，不需要其他额外说明。`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "你是一个专业的小说内容优化专家，擅长改进和完善文学创作内容。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) throw new Error('API请求失败');

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });
    } catch (error) {
        console.error('优化内容时出错:', error);
        res.status(500).json({ error: '优化内容时发生错误' });
    }
});

// 工具函数
function parseOutlines(content, totalChapters) {
    const outlines = [];
    const lines = content.split('\n');
    let currentOutline = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('第') && line.includes('章：')) {
            if (currentOutline) {
                outlines.push(currentOutline);
            }
            currentOutline = line.split('：')[1];
        } else if (line) {
            currentOutline += '\n' + line;
        }
    }
    
    if (currentOutline) {
        outlines.push(currentOutline);
    }

    // 确保大纲数量与章节数匹配
    while (outlines.length < totalChapters) {
        outlines.push('');
    }
    
    return outlines.slice(0, totalChapters);
}

function validateContent(content, targetLength) {
    if (!content) {
        return {
            isValid: false,
            error: '生成的内容为空'
        };
    }

    const actualLength = content.length;
    const minLength = targetLength * 0.8;
    const maxLength = targetLength * 1.2;

    if (actualLength < minLength) {
        return {
            isValid: false,
            error: `内容长度不足，当前${actualLength}字，要求最少${minLength}字`
        };
    }

    if (actualLength > maxLength) {
        return {
            isValid: false,
            error: `内容超出长度限制，当前${actualLength}字，要求最多${maxLength}字`
        };
    }

    // 检查内容质量
    if (content.includes('……') || content.includes('...')) {
        return {
            isValid: false,
            error: '内容中包含过多省略号，可能质量不佳'
        };
    }

    const paragraphs = content.split('\n').filter(p => p.trim());
    if (paragraphs.length < 5) {
        return {
            isValid: false,
            error: '段落数量过少，内容可能不够丰富'
        };
    }

    return {
        isValid: true
    };
}

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 