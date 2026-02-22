export const mockProblems = [
    {
        category: 1,
        level: 1,
        problems: [
            {
                id: "mock-1",
                name: "小さい順に並べ替えろ",
                elements: ["ネズミ", "猫", "犬", "ゾウ"],
                correctOrder: ["ネズミ", "猫", "犬", "ゾウ"]
            },
            {
                id: "mock-2",
                name: "昔からある順に並べ替えろ",
                elements: ["ファミコン", "ゲームボーイ", "Nintendo DS", "Nintendo Switch"],
                correctOrder: ["ファミコン", "ゲームボーイ", "Nintendo DS", "Nintendo Switch"]
            },
            {
                id: "mock-3",
                name: "北から順に並べ替えろ",
                elements: ["北海道", "青森県", "東京都", "沖縄県"],
                correctOrder: ["北海道", "青森県", "東京都", "沖縄県"]
            },
            {
                id: "mock-4",
                name: "背が低い順に並べ替えろ",
                elements: ["東京タワー", "東京スカイツリー", "富士山", "エベレスト"],
                correctOrder: ["東京タワー", "東京スカイツリー", "富士山", "エベレスト"]
            },
            {
                id: "mock-5",
                name: "画数が少ない順に並べ替えろ",
                elements: ["一", "十", "百", "千"],
                correctOrder: ["一", "十", "千", "百"]
            }
        ]
    }
];

export function getMockProblem(categoryId, levelId, seed) {
    const categoryProblems = mockProblems.find(
        (p) => p.category === categoryId && p.level === levelId
    );
    if (!categoryProblems || categoryProblems.problems.length === 0) {
        return {
            id: "fallback",
            name: "数字を小さい順に並べろ",
            elements: ["1", "2", "3", "4"],
            correctOrder: ["1", "2", "3", "4"]
        };
    }

    // Use seed to deterministically pick a problem and shuffle elements
    const problemIndex = seed % categoryProblems.problems.length;
    let originalProblem = JSON.parse(JSON.stringify(categoryProblems.problems[problemIndex]));

    // deterministic shuffle based on seed (Fisher-Yates)
    let shuffledElements = [...originalProblem.elements];
    let currentSeed = seed;
    for (let i = shuffledElements.length - 1; i > 0; i--) {
        currentSeed = (currentSeed * 16807) % 2147483647;
        const j = currentSeed % (i + 1);
        [shuffledElements[i], shuffledElements[j]] = [shuffledElements[j], shuffledElements[i]];
    }

    originalProblem.elements = shuffledElements;
    return originalProblem;
}
