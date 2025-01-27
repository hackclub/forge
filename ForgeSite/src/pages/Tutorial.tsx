import { Box, Typography, Card, CardContent, Button } from '@mui/material'

const Tutorial = () => {
  const tutorials = [
    {
      level: 'Beginner',
      description: 'Learn the basics of Forge and 3D printing',
      color: '#4CAF50',
      links: [
        { title: 'Getting Started with Forge', url: '#' },
        { title: 'Basic 3D Printing Concepts', url: '#' },
        { title: 'Your First Print', url: '#' }
      ]
    },
    {
      level: 'Intermediate',
      description: 'Advance your skills with more complex projects',
      color: '#FF9800',
      links: [
        { title: 'Custom Modifications', url: '#' },
        { title: 'Advanced Print Settings', url: '#' },
        { title: 'Material Science', url: '#' }
      ]
    },
    {
      level: 'Advanced',
      description: 'Master CAD and 3d Modeling',
      color: '#F44336',
      links: [
        { title: 'Advanced Assemblies', url: '#' },
        { title: 'Custom Firmware', url: '#' },
        { title: 'Advanced Troubleshooting', url: '#' }
      ]
    }
  ]

  return (
    <Box sx={{ pt: 12, px: 8, minHeight: '100vh' }}>
      <Typography variant="h3" sx={{ color: '#F95E1D', mb: 4 }}>
        Forge Tutorials
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {tutorials.map((tutorial) => (
          <Card key={tutorial.level} sx={{ 
            flex: '1 1 300px',
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${tutorial.color}`
          }}>
            <CardContent>
              <Typography variant="h5" sx={{ color: tutorial.color, mb: 2 }}>
                {tutorial.level}
              </Typography>
              <Typography sx={{ color: '#EEE', mb: 3 }}>
                {tutorial.description}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {tutorial.links.map((link) => (
                  <Button 
                    key={link.title}
                    href={link.url}
                    sx={{ 
                      color: '#EEE',
                      textAlign: 'left',
                      '&:hover': { color: tutorial.color }
                    }}
                  >
                    {link.title}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default Tutorial