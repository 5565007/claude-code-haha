import type { Command } from '../../commands.js'

const agents = {
  type: 'local-jsx',
  name: 'agents',
  aliases: ['agent'],
  description: 'Manage agent configurations',
  load: () => import('./agents.js'),
} satisfies Command

export default agents
