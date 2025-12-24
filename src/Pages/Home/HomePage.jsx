import Card from './Card'
export default function HomePage() {
  return (
    <>
      <div className="w-full h-full">
        <h1>Home Page</h1>
        <div className="flex justify-between  w-full gap-1 ">
          <Card amt="741" topic="Topic" act="Return" />
        </div>
      </div>
    </>
  )
}
