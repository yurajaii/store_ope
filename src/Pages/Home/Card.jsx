function Card({ amt, act }) {
  return (
    <>
      <div
        className="flex flex-col gap-2 items-center h-35 p-6 bg-white  border-gray-200 rounded-3xl shadow-md hover:scale-105 hover:cursor-pointer transition-transform duration-300 ease-in-out"
      >
        <p className="text-xl">{act}</p>
        <p className="text-3xl font-semibold text-primary p-2">{amt}</p>
      </div>
    </>
  )
}

export default Card
