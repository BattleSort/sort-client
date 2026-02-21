export const mockProblems = [
    {
        category: 1, // sample category ID
        level: 1,    // sample level ID
        problems: [
            {
                id: "mock-1",
                name: "Sort by size (small to large)",
                elements: ["Elephant", "Cat", "Mouse", "Ant"]
            },
            {
                id: "mock-2",
                name: "Sort alphabetically",
                elements: ["Banana", "Apple", "Cherry", "Date"]
            }
        ]
    },
    {
        category: 1,
        level: 2,
        problems: [
            {
                id: "mock-3",
                name: "Sort by release year (old to new)",
                elements: ["PS4", "PS2", "PS1", "PS3"]
            }
        ]
    }
];

export function getMockProblem(categoryId, levelId, seed) {
    const categoryProblems = mockProblems.find(
        (p) => p.category === categoryId && p.level === levelId
    );
    if (!categoryProblems || categoryProblems.problems.length === 0) {
        // fallback problem
        return {
            id: "fallback",
            name: "Sort numbers",
            elements: ["4", "1", "3", "2"],
        };
    }

    // Use seed to deterministically pick a problem and shuffle elements
    const problemIndex = seed % categoryProblems.problems.length;
    const originalProblem = categoryProblems.problems[problemIndex];

    // deterministic shuffle based on seed
    let shuffledElements = [...originalProblem.elements];
    let currentSeed = seed;
    for (let i = shuffledElements.length - 1; i > 0; i--) {
        currentSeed = (currentSeed * 16807) % 2147483647;
        const j = currentSeed % (i + 1);
        [shuffledElements[i], shuffledElements[j]] = [shuffledElements[j], shuffledElements[i]];
    }

    return {
        ...originalProblem,
        elements: shuffledElements
    };
}
