import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="container mx-auto py-12">
      <div className="flex flex-col items-center space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold">
            Hello There{' '}
            <span className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 bg-clip-text text-transparent">
              JarrBank
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Professional multi-chain DeFi portfolio management platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Portfolio
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multi-chain DeFi portfolio tracking and management
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Analytics
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced portfolio health analytics and insights
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                LP Tracking
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Liquidity provider position tracking and management
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Automation
                <span className="text-primary">→</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cross-LP compounding workflows and automation
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button size="lg">Get Started</Button>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
      </div>
    </main>
  )
}