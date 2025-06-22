import React from 'react';
import { 
  AcademicCapIcon, 
  BuildingOffice2Icon, 
  LightBulbIcon,
  RocketLaunchIcon,
  UserIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const About: React.FC = () => {
  const stats = [
    { name: 'Years of AI Innovation', value: '5+' },
    { name: 'Enterprise Clients', value: '100+' },
    { name: 'AI Models Deployed', value: '50+' },
    { name: 'Success Rate', value: '99%' },
  ];

  const values = [
    {
      name: 'Innovation First',
      description: 'We push the boundaries of what\'s possible with artificial intelligence.',
      icon: LightBulbIcon,
    },
    {
      name: 'Enterprise Grade',
      description: 'Security, reliability, and compliance are built into every solution.',
      icon: BuildingOffice2Icon,
    },
    {
      name: 'Client Success',
      description: 'Your success is our mission. We partner with you for long-term growth.',
      icon: RocketLaunchIcon,
    },
    {
      name: 'Continuous Learning',
      description: 'We stay ahead of AI trends to deliver cutting-edge solutions.',
      icon: AcademicCapIcon,
    },
  ];

  return (
    <section id="about" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-dreamer-blue">About Us</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-dreamer-dark sm:text-4xl">
            Pioneering the Future of AI Solutions
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            At Dreamer AI Solutions, we transform visionary ideas into intelligent, practical solutions 
            that drive real business results for law firms and enterprises.
          </p>
        </div>

        {/* Stats */}
        <div className="mx-auto max-w-4xl">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 mb-20">
            {stats.map((stat, index) => (
              <div 
                key={stat.name} 
                className="flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <dt className="text-sm font-medium leading-6 text-gray-600">{stat.name}</dt>
                <dd className="mt-2 text-3xl font-bold leading-10 tracking-tight text-dreamer-blue">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Our Story */}
        <div className="mx-auto max-w-4xl mb-20">
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-2 items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-dreamer-dark mb-6">
                Our Story
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Founded with a vision to democratize artificial intelligence for enterprises, 
                Dreamer AI Solutions emerged from the recognition that powerful AI shouldn't be 
                exclusive to tech giants.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                We specialize in creating bespoke AI solutions that integrate seamlessly with 
                existing workflows, particularly in the legal and professional services sectors 
                where precision, security, and reliability are paramount.
              </p>
              <p className="text-lg text-gray-600">
                Our proprietary Dreamer AI technology stack combines the latest advances in 
                machine learning, natural language processing, and automation to deliver 
                solutions that truly understand and enhance your business processes.
              </p>
            </div>
            <div className="relative">
              <div className="aspect-w-4 aspect-h-3 bg-gradient-to-br from-dreamer-blue to-blue-600 rounded-lg p-8 text-white">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <LightBulbIcon className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                    <h4 className="text-xl font-semibold mb-2">Innovation in Action</h4>
                    <p className="text-blue-100">
                      Transforming complex challenges into intelligent solutions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Founder Section */}
        <div className="mx-auto max-w-4xl mb-20">
          <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3 items-center">
              <div className="lg:col-span-1">
                <div className="aspect-w-1 aspect-h-1 bg-dreamer-blue rounded-full w-48 h-48 mx-auto flex items-center justify-center">
                  <UserIcon className="h-24 w-24 text-white" />
                </div>
              </div>
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold tracking-tight text-dreamer-dark mb-4">
                  Meet Our Founder
                </h3>
                <h4 className="text-xl font-semibold text-dreamer-blue mb-2">
                  J. LaSalle
                </h4>
                <p className="text-lg text-gray-600 mb-4">
                  Founder & CEO, Dreamer AI Solutions
                </p>
                <p className="text-gray-600 mb-6">
                  A visionary leader in artificial intelligence and enterprise solutions, 
                  J. LaSalle brings years of experience in transforming traditional business 
                  processes through innovative AI implementations. With a deep understanding 
                  of both technology and business strategy, J. has led Dreamer AI Solutions 
                  to become a trusted partner for law firms and enterprises seeking 
                  competitive advantages through intelligent automation.
                </p>
                <a
                  href="https://www.linkedin.com/in/jlasalle973"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-dreamer-blue hover:text-blue-600 font-medium transition-colors"
                >
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Connect on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold tracking-tight text-dreamer-dark mb-4">
              Our Values
            </h3>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          
          <dl className="grid max-w-none grid-cols-1 gap-8 lg:grid-cols-2">
            {values.map((value, index) => (
              <div 
                key={value.name} 
                className="relative bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <dt>
                  <div className="absolute flex h-12 w-12 items-center justify-center rounded-lg bg-dreamer-blue text-white">
                    <value.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg font-semibold leading-7 text-dreamer-dark">
                    {value.name}
                  </p>
                </dt>
                <dd className="ml-16 mt-2 text-base text-gray-600">
                  {value.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* CTA Section */}
        <div className="mx-auto max-w-2xl text-center mt-20">
          <div className="bg-gradient-to-r from-dreamer-blue to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
            <p className="text-blue-100 mb-6">
              Let's discuss how Dreamer AI Solutions can help you unlock new possibilities.
            </p>
            <a
              href="#contact"
              className="inline-block bg-white text-dreamer-blue px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105"
            >
              Start Your AI Journey
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;