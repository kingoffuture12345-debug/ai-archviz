import { LibraryItem } from '../types';

export const INITIAL_PROMPT_LIBRARY_DATA: LibraryItem[] = [
  // --- Root Libraries ---
  {
    id: 'lib_interior',
    name: 'أنماط التصميم الداخلي',
    parentId: null,
    type: 'library',
    timestamp: Date.now(),
  },
  {
    id: 'lib_exterior',
    name: 'أنماط التصميم الخارجي',
    parentId: null,
    type: 'library',
    timestamp: Date.now(),
  },
  {
    id: 'lib_materials',
    name: 'الخامات والمواد',
    parentId: null,
    type: 'library',
    timestamp: Date.now(),
  },

  // --- Interior Prompts ---
  {
    id: 'prompt_interior_1',
    name: 'غرفة معيشة مودرن',
    parentId: 'lib_interior',
    type: 'prompt',
    content: 'A hyper-realistic, photorealistic image of a modern living room with a minimalist aesthetic. Feature a low-profile sectional sofa in a neutral grey fabric, a sleek marble coffee table, and large floor-to-ceiling windows that flood the space with natural daylight. The flooring should be light oak wood, and the walls a soft off-white. Include subtle recessed lighting and a single large abstract painting on the main wall. 8k, professional architectural photography.',
    timestamp: Date.now(),
  },
  {
    id: 'prompt_interior_2',
    name: 'مطبخ ريفي',
    parentId: 'lib_interior',
    type: 'prompt',
    content: 'A cozy, rustic farmhouse kitchen. The scene should feature shaker-style cabinets painted in a creamy white, a large wooden island with a butcher block top, and a classic apron-front sink. Include vintage-style pendant lights hanging over the island and terracotta tile flooring. The overall atmosphere should be warm and inviting, with sunlight streaming through a window. Photorealistic, high detail.',
    timestamp: Date.now(),
  },
  {
    id: 'prompt_interior_3',
    name: 'غرفة نوم بوهيمية',
    parentId: 'lib_interior',
    type: 'prompt',
    content: 'A bohemian (boho) style bedroom with a relaxed and eclectic vibe. Use a warm, earthy color palette with terracotta and mustard yellow accents. The bed should be low to the ground with layered textiles, including macrame wall hangings and patterned rugs. Incorporate numerous potted plants like ferns and monsteras to bring nature indoors. The lighting should be soft and ambient from a rattan pendant light. Photorealistic, inviting.',
    timestamp: Date.now(),
  },

  // --- Exterior Prompts ---
  {
    id: 'prompt_exterior_1',
    name: 'فيلا حديثة',
    parentId: 'lib_exterior',
    type: 'prompt',
    content: 'A photorealistic architectural render of a modern two-story villa. The design should feature clean lines, a flat roof, and a combination of white stucco, dark wood paneling, and large glass walls. Include a minimalist landscaped garden with a rectangular swimming pool. The lighting should be set during a clear day, casting soft, realistic shadows. 8K, hyperrealistic, professional CGI.',
    timestamp: Date.now(),
  },
  {
    id: 'prompt_exterior_2',
    name: 'واجهة متجر كلاسيكية',
    parentId: 'lib_exterior',
    type: 'prompt',
    content: 'A charming, classic European-style storefront. The facade should be painted a pastel color (e.g., sage green or dusty blue) with large display windows framed in elegant white molding. Include an ornate sign with the shop name hanging above the entrance and flower boxes under the windows. The scene should be set on a cobblestone street. Photorealistic, highly detailed.',
    timestamp: Date.now(),
  },

  // --- Material Prompts ---
  {
    id: 'prompt_material_1',
    name: 'رخام كارارا مصقول',
    parentId: 'lib_materials',
    type: 'prompt',
    content: 'A photorealistic, seamless, tileable PBR texture of polished Carrara marble. The marble should have a clean white base with soft, subtle grey veining. The surface needs to be highly reflective and smooth, capturing realistic light reflections. 8k, high detail, professional material photography.',
    timestamp: Date.now(),
  },
  {
    id: 'prompt_material_2',
    name: 'ألواح خشب بلوط داكن',
    parentId: 'lib_materials',
    type: 'prompt',
    content: 'A photorealistic, seamless, tileable PBR texture of dark oak wood planks. The wood should have a deep, rich brown color with a prominent and realistic grain pattern. The finish should be semi-gloss, showing subtle highlights. 8k, high detail, realistic lighting.',
    timestamp: Date.now(),
  },
];
